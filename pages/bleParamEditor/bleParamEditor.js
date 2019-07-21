// pages/bleParamEditor/bleParamEditor.js
import {deviceRegister} from '../data/appsrv.js'
Page({

  /**
   * 页面的初始数据
   */
  data: {
    winWidth: null,
    winHeight: null,
    isEdit: false,
    batteryConfigKey : null,
    batteryConfigValue: null,
    backupConfigValue: null, 
    backupDate: null,
    backupTime: null,
    modifyList : [],
    emphasis: [12, 13, 14, 15, 25],
    dialogShow: false, 
    modifyIndex : null,
    inputValue : null,
    ctrlItems: [
      {name: '同口', value: 0x01, checked: true},
      {name: '电阻分流', value: 0x02, checked: true},
      {name: '三元锂电', value: 0x04, checked: true},
      {name: '强制修改', value: 0x8000, checked: false}],
    date: {},
    time: {},
    registerLoading: false,
    isDeviceIdEdited: false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;
    console.log('paraEditor onload:', options);
    _this.mac = options.mac;
    //获取系统信息
    wx.getSystemInfo({
      success: function (res) {
        _this.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });

    let pages = getCurrentPages();
    if (pages.length >= 2) {
      let prevPageData = pages[pages.length - 2].data;
      if (prevPageData.batteryConfigValue.length >= 28) {
        _this.data.date[26] = prevPageData.batteryConfigValue[26];
        _this.data.time[27] = prevPageData.batteryConfigValue[27].slice(0, 5);        
        _this.setData({
          batteryConfigKey: prevPageData.batteryConfigKey,
          batteryConfigValue: prevPageData.batteryConfigValue.slice(),          
          date: _this.data.date,
          time: _this.data.time
        });
      }
      if (prevPageData.batteryConfigValue.length >= 43) {
        _this.data.date[39] = prevPageData.batteryConfigValue[39];
        _this.data.time[40] = prevPageData.batteryConfigValue[40].slice(0, 5); 
        _this.data.date[41] = prevPageData.batteryConfigValue[41];
        _this.data.time[42] = prevPageData.batteryConfigValue[42].slice(0, 5);     
        _this.setData({
          date: _this.data.date,
          time: _this.data.time
        }) 
      }
      _this.setData({
        backupConfigValue: prevPageData.batteryConfigValue.slice(),
        backupDate: JSON.stringify(_this.data.date),
        backupTime: JSON.stringify(_this.data.time)
      })
    }    
  },
  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },
  parseCtrlInfo(data) {
    let _this = this;
    let items = _this.data.ctrlItems;
    for (let i = 0; i < items.length; i++){
      items[i].checked = items[i].value & data ? true : false;      
    }
    _this.setData({
      ctrlItems: items
    })
  },
  programCtrlChange(e) {
    let _this = this;
    let ctrl = e.detail.value
    .map((value, index, array)=> {return parseInt(value)})
    .reduce((pre,cur,curIndex,arr) => {return pre + cur;});
    console.log('programCtrlChange:', ctrl)
    _this.setData({inputValue: ctrl})
  },
  paramValueClick(e) {
    let _this = this;
    console.log('paramValueClick', e);
    _this.data.modifyIndex = e.currentTarget.dataset.index;
    
    if ((_this.data.modifyIndex >= 26 &&  _this.data.modifyIndex <= 27) 
      || (_this.data.modifyIndex >= 39 &&  _this.data.modifyIndex <= 42)) {
        
    } else {
      if (_this.data.modifyIndex == 29) {
        _this.parseCtrlInfo( _this.data.batteryConfigValue[29]);
      } 
      _this.setData({
        inputValue: _this.data.batteryConfigValue[_this.data.modifyIndex],
        modifyIndex: _this.data.modifyIndex,
        dialogShow: true,
        isDeviceIdEdited: _this.isEdited()
      });
    }    
  }, 
  dialogConfirm(e) {
    let _this = this,
    modifyIndex = _this.data.modifyIndex,
    content = _this.data.inputValue;
    console.log("dialogConfirm:", modifyIndex, content);
    if (modifyIndex != null && content) {
      console.log("data:", _this.data.backupConfigValue);
      if (_this.checkParamValid(modifyIndex, content)) {
        if (content != _this.data.backupConfigValue[modifyIndex]) { // 添加到已修改数组
          if (_this.data.modifyList.indexOf(modifyIndex) == -1) {
            _this.data.modifyList.push(modifyIndex);
          }
        } else {  // 从已修改的index数组中删除
          _this.data.modifyList = _this.data.modifyList.filter((element, index, self) => {
            return element != modifyIndex;
          });
          console.log("change:", _this.data.modifyList);
        }
        _this.data.batteryConfigValue[modifyIndex] = content;
        _this.setData({
          modifyList: _this.data.modifyList,
          batteryConfigValue: _this.data.batteryConfigValue
        });
      } else {
        wx.showToast({
          title: '参数格式错误',
          icon: 'none',
        });
      }      
    }
    _this.setData({
      dialogShow: false
    });
    _this.data.inputValue = null;
    _this.data.modifyIndex = null;
  }, 
  dialogCancel(e) {
    this.setData({
      dialogShow: false
    });
  }, 
  dialogInputChange(e) {
    let _this = this;
    console.log("input:", e);
    _this.data.inputValue = e.detail.value;
  }, 
  checkParamValid(modifyIndex, param) {
    if (modifyIndex == 44) {
      if (param.length >= 4 && parseInt(param.substring(3))) return true;
      return false;
    } 
    return true;
  },
  onDateChange(e) {
    let _this = this;
    let _index = e.target.dataset.index;
    _this.data.batteryConfigValue[_index] = e.detail.value;
    _this.data.date[_index] = e.detail.value;
    _this.setData({
      batteryConfigValue: _this.data.batteryConfigValue,
      date: _this.data.date
    });
    console.log('onDateChange:from',_this.data.backupConfigValue[_index], 'to', e.detail.value);
    if (e.detail.value == _this.data.backupConfigValue[_index]) {
      _this.data.modifyList = _this.data.modifyList.filter((element, index, array) => {
        element != _index;
      })
    } else if (_this.data.modifyList.indexOf(_index) == -1){
       _this.data.modifyList.push(_index);
    }   
    _this.setData({
      modifyList: _this.data.modifyList
    })
  }, 
  onTimeChange(e) {
    let _this = this;
    let _index = e.target.dataset.index;
    _this.data.batteryConfigValue[_index] = e.detail.value + _this.data.batteryConfigValue[_index].substring(5);
    _this.data.time[_index] = e.detail.value;
    _this.setData({
      batteryConfigValue: _this.data.batteryConfigValue,
      time: _this.data.time
    });
    console.log('onTimeChange:old-', _this.data.backupConfigValue[_index], 'new-', e.detail.value);
    if (e.detail.value == _this.data.backupConfigValue[_index].slice(0, 5)) {
      _this.data.modifyList = _this.data.modifyList.filter((element, index, array) => {
        element != _index;
      })
    } else if (_this.data.modifyList.indexOf(_index) == -1) {
      _this.data.modifyList.push(_index);
    }
    _this.setData({
      modifyList: _this.data.modifyList
    })
  },
  bleParamRestore() {
    let _this = this;
    _this.data.modifyList.length = 0;
    _this.setData({
      modifyList: _this.data.modifyList,
      batteryConfigValue: _this.data.backupConfigValue.slice(),
      date: JSON.parse(_this.data.backupDate),
      time: JSON.parse(_this.data.backupTime)
    })
  },
  bleParamEditConfirm() {
    let _this = this;
    let pages = getCurrentPages();
    let prevPage = pages[pages.length - 2];
    prevPage.setData({
      isEdit: true,
      batteryConfigValue: _this.data.batteryConfigValue
    });
    wx.navigateBack({
      delta: 1,
    });
  },
  deviceRegister() {
    let _this = this;
    _this.setData({registerLoading: true});
    deviceRegister(_this.mac, function successCb(res) {
      _this.setData({registerLoading: false})
      console.log('deviceRegister result=', res.data)
      if (res.data != null && res.data.code == 0) {
        _this.setData({
          inputValue: res.data.deviceId,
          isDeviceIdEdited: true})
      }
    },
    function failCb() {
      _this.setData({registerLoading: false});
      wx.showToast({
        title: '注册失败，请检查网络',
        icon: 'none',
      });
    })
  },
 isEdited() {
    let _this = this;
    if (_this.data.backupConfigValue.length < 45) return true; // 兼容V2设置
    for (let i = 0; i < 3; i++) {
      if (_this.data.batteryConfigValue[44].charCodeAt(i) != 0xFF) return true;
    }
    return false;
  }
})