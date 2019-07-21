// pages/bms/parameter/parameter.js
const http = require('../../data/http.js');
const event = require('../../../utils/event');
import {DataManager} from '../../data/model';
import { byte2SignedInt} from '../../../utils/util';
import{gps84_To_Gcj02} from '../../../utils/gpsUtils.js';
import { BMSDataParser, packBMSCtrlCmd, packMenuSetCmd,
  toBatteryConfigArray} from '../../ble/BleDataParser.js';
import { isAdminLogin} from '../../data/appsrv.js';
const bleHead = require('../bleHead/bleHead.js');
const total = require('../total/total.js');
const app = getApp();

Page({

  /**
   * 页面的初始数据
   */
  data: {
    // swiper 控件数据
    winWidth: 0,
    winHeight: 0,
    currentTab: 0,
    iconlists: [
      { normal: "../../../image/ic_menu_home_81.png", focus: "../../../image/ic_menu_home_81_p.png" },
      { normal: "../../../image/ic_battery_81.png", focus: "../../../image/ic_battery_81_p.png" },
      { normal: "../../../image/icon_Param.png", focus: "../../../image/icon_Param_HL.png" },
      { normal: "../../../image/icon_component.png", focus: "../../../image/icon_component_HL.png" },
    ],
    // 网络连接数据
    autoFlash: '',
    markers: [],
    searchSuccess: false,
    deviceNumber: '',
    deviceStatus: '未连接',
    reloadDeviceTime: '读取参数',
    infoListTotal: [{ key:'总里程值', value: '' }, {key:'续航里程', value:''}],
    infoList: [],
    temperatureList: [],
    circleData:[],  // 显示在圆圈里面的数据
    singleBatteryInfo: [],
    batteryConfigKey: ['一级放电电流门限A', '一级放电电流允许的时间S', '二级放电电流门限A', '二级放电电流允许的时间S', '放电截止电压V',
    '放电恢复电压V', '充电恢复电压V', '充电截止电压V', '电池平衡电压V', '一级高温度门限℃', '二级高温度门限℃', '电流校准系数‰', '电池节数',
    '额定电量值AH', '电流量程A', '电流零点偏移值', '一级低温度门限℃', '二级低温度门限℃', '充电电流门限A', '一级管理系统温度门限℃', 
    '二级管理系统温度门限℃', '加热功能的触发温度℃', '加热功能的关闭温度℃', '温度屏蔽控制,0屏蔽1不屏蔽', '电池单体压差低段门限V', '电池满电电压V', 
    '电池内部日期', '电池内部时间', '电池剩余可用天数', '程序控制开关', '电流误检门限A', '散热关闭温度℃', '散热开启温度℃', '浮充电压门限V',
    '压差报警分段门限V', '电池单体压差高段门限V', '充电压差报警门限V', '充电压差报警压差V', '总放电Ah数', '租赁开始日期', '租赁开始时间', 
    '时间戳日期', '时间戳时间','租赁天数', '设备ID', '放电截止总电压V', '充电截止总电压V'],
    batteryConfigValue: [],
    GPSInfoList: [],
    batterySpeed: [],
    lat : null,
    lon : null,
    // 蓝牙连接数据
    connectMode: 1,
    bleName : null,
    bleShowAddress: null,
    bleAddress : null,
    bleConnected : 1, // 1:未连接，2：正在连接，3：已连接
    isAdmin: false,
    isEdit: false,  // 是否有修改
    bmsVersionInfo: '点击“获取版本”查看BMS固件版本',
    bmsBtnUpdate: 'BMS固件更新',
    isShown: false,
    isRecording : false,
    modalTitle: 'BMS固件更新',
    modalContent: '',
    modalProgress: 40
  },
  /**
   * 滑动切换tab
   */
  bindChange: function (e) {
    var that = this;
    that.setData({ currentTab: e.detail.current });
  },
  /**
   * 点击切换tab
   */
  swichNav: function (e) {
    var that = this;
    if (this.data.currentTab === e.currentTarget.dataset.current) {
      //点击的是同一个，则不操作
      return false;
    } else {
      that.setData({
        currentTab: e.currentTarget.dataset.current
      })
    }

  },
  /**
   * 拦截Swiper的水平滑动事件
   */
  catchTouchMove() {
    return false;
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;
    //初始化页面高度
    _this.initViewsHeight();
    wx.setKeepScreenOn({keepScreenOn: true, success(res) {
      console.log('screenOnSet:', res);
    }});
    if (options.connectMode) {
      app.globalData.connectMode = options.connectMode;
    }
    _this.setData({
      connectMode: app.globalData.connectMode
    });
    if (options.connectMode == 2) { // 蓝牙连接，注意不能使用data.connectMode,异步赋值
      _this.setData({
        bleName: options.name,
        bleAddress : options.deviceId,
        bleShowAddress: options.deviceId.trim().slice(-17)
      });
      /*this._worker = wx.createWorker('pages/workers/worker.js');
      this._worker.onMessage(this.onWorkerMessage);*/      
    }    
    if (app.globalData.connectMode == 2) {  // 不使用options.connectMode，便于调试
      bleHead.registerBLEDataListener(_this);   // 蓝牙底层连接
      event.register('BLE_DATA', _this, bleHead.onWorkerMessage); // 蓝牙数据监听
    }    
    console.log(`onLoad Home:${JSON.stringify(options)},mode=${app.globalData.connectMode}`);
    isAdminLogin((res) => {
      console.log("onLoad Home, isAdmin:", res);
      _this.setData({
        isAdmin: res
      })
    });
  },

  onUnload() {
    console.log("Home onUnload");
    if (app.globalData.connectMode == 2) {  // 蓝牙连接时断开连接
      this.bleDisconnect();
    }
    event.unregister('BLE_DATA', this);
    //if (this._worker) {this._worker.terminate();}
    clearTimeout(this.autoFlash);
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    let _this = this;
    _this.pgModal = _this.selectComponent("#modal");
    //_this.pgModal.showModal();
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    let _this = this;
    wx.getStorage({
      key: 'deviceId',
      success(res) {
        console.log("get deviceNum success:" + res.data)
        if (res.data) {
          _this.setData({
            deviceNumber: res.data
          })
        }
      },
      fail(res) {
        console.log("get deviceNum fail:" + res.data)
      }
    });

    wx.getStorage({
      key: 'expireTime',
      success(res) {
        //console.log("get expireTime success:" + res.data);
        if (res.data) {
          _this.reloadDeviceTimeCount(_this);
        }
      },
      fail(res) {
        console.log("get expireTime fail:" + res.data);
      }
    });
    _this.isShown = true; // 保存显示状态用于渲染,未在wxml绑定的数据不用调用setData
                               // 否则会触发无效刷新，影响性能

    /**************测试数据 *************/
    //bleHead.testData(_this);
     /**************测试数据 *************/
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    console.log("Home onHide()");
    let _this = this;
    _this.isShown = false;
    clearTimeout(_this.autoFlash); // 跳到其它页面停止刷新
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },
  scrolltolower() {},
  onDialogConfirm(res) {
    bleHead.onProgressDialogConfirm(res);
  },
  onDialogCancel(res){
    bleHead.onProgressDialogCancel(res);
  },
  //监控输入框方法
  inputDeviceID: function (e) {
    clearTimeout(this.autoFlash);
    this.setData({
      deviceNumber: e.detail.value
    });
  },
  //点击扫码按钮的方法
  getDeviceInfoByScanCode: function () {
    let _this = this;
    wx.scanCode({
      success: function (result) {
        console.log(result.result);
        clearTimeout(_this.autoFlash);
        _this.setData({
          deviceNumber: result.result
        });
      }
    });
  },
  getDeviceInfo: function () {
    wx.showLoading({
      title: '加载中'
    });
    let _this = this;
    _this.data.infoListTotal = [];
    //查询设备状态 509579601
    http.getDeviceStatus(_this.data.deviceNumber, (result) => {
      console.log(`getDeviceStatus code=${result.data.errno}`);
      if (result.data.errno == 0) {
        clearTimeout(_this.autoFlash);
        _this.autoFlash = setTimeout(() => {
          _this.getDeviceInfo();
        }, 60 * 1000);
        let data = result.data.data
        _this.setData({
          deviceStatus: data.devices[0].online ? '在线' : '离线'
        });
      }
    }, () => {
      console.log("getDeviceInfo failed.");
    });
    http.getDeviceDataPoints(_this.data.deviceNumber, (result) => {
      wx.hideLoading();
      if (result != null && result.data.errno == 0) {
        //请求成功，保存用户当前输入设备ID
        wx.setStorage({
          key: 'deviceId',
          data: _this.data.deviceNumber,
          success() {
            console.log("save deviceNum success.")
          },
          fail(res) {
            console.log("save deviceNum fail:" + res.data)
          }
        });
        let [firstPageInfo, tempList] = _this.postProcessData();
        _this.setData({
          searchSuccess: true,
          infoListTotal: DataManager.infoListTotal,
          infoList: firstPageInfo,
          circleData: _this.data.circleData,
          temperatureList: tempList,
          singleBatteryInfo : DataManager.singleBatteryInfo,
          batteryConfigValue : DataManager.batteryConfigValue,
          GPSInfoList : DataManager.GPSInfoList,
          lat : DataManager.lat,
          lon : DataManager.lon,
          batterySpeed : DataManager.batterySpeed
        });
        _this.renderMap();
        _this.drawBgCanvas();
      } else {
        _this.setData({
          searchSuccess: false,
          deviceStatus: '未连接',
          infoListTotal: []
        });
        wx.showToast({
          title: 'ID输入错误',
          icon: 'none',
          duration: 2000
        });
      }     
    }, () => {
      wx.hideLoading();
      console.log("getDeviceDataPoints 接口调用失败");
    });
  },
  drawBgCanvas() {
    let _this = this;
    if (!_this.isShown) return;
    let context = wx.createCanvasContext('bg-canvas');
    let query = wx.createSelectorQuery();
    total.drawCircle(query, context, _this.data.circleData[4].value.toString(), _this.data.circleData[6].value.toString());
  },
  initViewsHeight() {
    let _this = this;
    wx.getSystemInfo({
      success: function (res) {
        console.log(`height:${res.windowHeight},width:${res.windowWidth}`);
        _this.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight,
        });
      }
    });
  },
  renderMap() {
    let _this = this;
    let [lat, lon] = gps84_To_Gcj02(parseFloat(DataManager.lat), parseFloat(DataManager.lon)); // 腾讯地图坐标纠偏
    console.log(`showloaction,lat:${lat},lon:${lon}`);
    _this.setData({
      markers: [{
        iconPath: "/resources/others.png",
        id: 0,
        latitude: lat,
        longitude: lon,
        width: 50,
        height: 50
      }],
    });
    wx.createMapContext('map').includePoints({
      points: [{
        latitude: lat,
        longitude: lon
      }],
      padding: 10
    });
  },
  reloadDevice() {
    let _this = this;
    if (_this.data.reloadDeviceTime === '读取参数') {
      http.reloadDeviceParameter(_this.data.deviceNumber, (result) => {
        if (result.data.errno == 0) {
          wx.showToast({
            title: '读取成功',
            icon: 'none',
            duration: 2000
          });
          let expireSecond = 60,
            expireTime = Date.parse(new Date()) + expireSecond * 1000;

          wx.setStorageSync('expireTime', expireTime);
          _this.setData({
            reloadDeviceTime: expireSecond
          });
          _this.reloadDeviceTimeCount(_this);
        } else {
          console.log(`reloadDevice:code=${result.data.errno},msg=${result.data.error}`);
          let errMsg = '读取失败，请稍后再试。';
          if (result.data.errno == 10) {
            errMsg = `读取失败:${result.data.error}`;
          } 
          wx.showToast({
            title: errMsg,
            icon: 'none',
            duration: 2000
          });
        }
      }, () => {
        console.log("reloadDeviceParameter 接口调用失败");
      });
      }
  },

  //启动倒计时功能
  reloadDeviceTimeCount: (_this) => {
    _this.reloadDeviceTimer = setInterval(() => {
      let expireTime = wx.getStorageSync('expireTime'),
        nowTime = Date.parse(new Date()),
        isExpire = nowTime - expireTime;

      if (isExpire < 0) {
        _this.setData({
          reloadDeviceTime: Math.abs(isExpire / 1000)
        });
      } else {
        _this.setData({
          reloadDeviceTime: '读取参数'
        });
        clearInterval(_this.reloadDeviceTimer);
      }
    }, 1000);
  },
  goDevicePositionHistory: function () {
    wx.navigateTo({
      url: '../../batteryGPS/batteryGPS?deviceNumber=' + this.data.deviceNumber
    })
  },
  modalChange(res) {
    bleHead.modalChange(res);
  },
  bleConnect() {
    bleHead.bleConnect();
  },
  bleDisconnect() {
    bleHead.bleDisconnect();    
  },
  
  bleParamRecord() {
    bleHead.bleParamRecord();
  },
  
  bleParamRefresh() {
    bleHead.bleSendData(packBMSCtrlCmd(BMSDataParser.CMD_GET_MENU));
  },
  bleParamEdit() {
    let _this = this;
    if (_this.data.isEdit) {
      let data = packMenuSetCmd(toBatteryConfigArray(_this.data.batteryConfigValue));
      console.log('param2Byte:', data);
      bleHead.bleSendData(data);
      _this.setData({
        isEdit: false,
      })
    } else {
      let mac = _this.data.deviceNumber;
      if (_this.data.connectMode == 2) mac = _this.data.bleAddress;
      wx.navigateTo({
        url: '/pages/bleParamEditor/bleParamEditor?mac=' + mac,
        success: function(res) {},
        fail: function(res) {},
        complete: function(res) {},
      })
    }
  },
  
  bleControl(event) {
    switch (event.currentTarget.dataset.type) {
      case 'getVersion':
        bleHead.bleSendData(packBMSCtrlCmd(BMSDataParser.CMD_VERSION));
        break;
      case 'reset':
        bleHead.bleSendData(packBMSCtrlCmd(BMSDataParser.CMD_RESET));
        break;
      case 'powerOff':
        bleHead.bleSendData(packBMSCtrlCmd(BMSDataParser.CMD_POWER_OFF));
        break;
      case 'calibrate':
        bleHead.bleSendData(packBMSCtrlCmd(BMSDataParser.CMD_CALIBRATE));
        break;
      case 'powerOffCause':
        bleHead.bleSendData(packBMSCtrlCmd(BMSDataParser.CMD_POWER_OFF_CAUSE));
        break;    
      case 'bmsUpdate':
        bleHead.bleUpdateClick();
        break;
    }
  },

  postProcessData() {
    let _this = this;
    let firstPageInfo = DataManager.infoList.slice();
    //console.log("isAdmin:", _this.data.isAdmin);
    if (_this.data.isAdmin) {
      _this.data.circleData = firstPageInfo.splice(3, 7);
    } else {
      _this.data.circleData = firstPageInfo.splice(3, 9);
    }
    //console.log("circleData", _this.data.circleData);
    let tempList = _this.data.circleData[3].value.split(','); // 温度信息放到第二页显示
    tempList = tempList.map((element) => { return byte2SignedInt(parseInt(element));})
    let filterTemps = tempList.filter((element, index, array) => {return element != -32;});
    tempList = tempList.map((element) => {if (element == -32) return '无'; return element;})
    //console.log(tempList);
    let singleVotalge = DataManager.singleBatteryInfo.map((element) => { return parseFloat(element) });
    let translateInfo = [];
    translateInfo.push({ key: '最高温度', value: Math.max(...filterTemps) });
    translateInfo.push({ key: '最低温度', value: Math.min(...filterTemps) });
    translateInfo.push({ key: '最高单体电压', value: Math.max(...singleVotalge) });
    translateInfo.push({ key: '最低单体电压', value: Math.min(...singleVotalge) });

    firstPageInfo.splice(3, 0, ...translateInfo);
    return [firstPageInfo, tempList];
  }
})