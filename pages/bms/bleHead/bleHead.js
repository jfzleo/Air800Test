// pages/bms/bleHead/bleHead.js
const BleSDPParser = require('../../ble/BleSDPParser.js');
import {DataManager} from '../../data/model';
import {fileUpload, bmsCheckUpdate, downloadFile, bmsGetVersions} from '../../data/appsrv.js';
import {BleProxyJDY} from '../../ble/BleDeviceProxy';
import { BMSDataParser, packBMSCtrlCmd, toBatteryConfigArray} from '../../ble/BleDataParser.js';
const util = require('../../../utils/util.js');

const regexSw = /BMSSW-(\d+)/;
const regexHw = /BMSHW-(\d+)/;

const STATUS_UPDATE_SUCCESS = 0;
const STATUS_WAITING_FOR_DOWNLOAD = 1;
const STATUS_DOWNLOAD_COMPLETED = 2;
const STATUS_PREPARE_TO_REBOOT = 3;
const STATUS_REBOOT_TO_BOOTLOADER = 4;
const STATUS_ERASE_FLASH_SUCCESS = 5;
const STATUS_FILE_TRANSPORT = 6;

var _this = null;
var bmsUpdateStatus = STATUS_UPDATE_SUCCESS;    // 更新状态
var bmsUpdateInfo = null;     // 服务器返回的更新信息
var sRecIndex = 0;       // 固件分行临时数组下标
var fdgOffset = 0;
var sRecords = null;          // 固件分行临时数组
var hwVer = '000';

function registerBLEDataListener(_home) {
  console.log("bleHead: registerBLEDataListener")
  _this = _home;
  wx.onBLEConnectionStateChange(function (res) {
    // 该方法回调中可以用于处理连接意外断开等异常情况
    console.log(`device ${res.deviceId} state has changed, connected: ${res.connected}`)
    if (res.connected) {
      _this.setData({ bleConnected: 3 })
    } else {
      _this.setData({ bleConnected: 1 })
    }
  });
  // 操作之前先监听，保证第一时间获取数据
  wx.onBLECharacteristicValueChange((characteristic) => {
    BleSDPParser.bufferData(characteristic.value);
    /*if (this._worker) {
      this._worker.postMessage({
        type: 'bleRawData',
        value: characteristic.value
      });
    }*/

  });
}

function bleConnect() {
  const deviceId = _this.data.bleAddress;
  const name = _this.data.bleName;
  _this.setData({
    bleConnected: 2
  })
  wx.createBLEConnection({
    deviceId,
    success: () => {
      _this.setData({
        bleConnected: 3
      })
      setTimeout(() => {
        BleProxyJDY.getInstance().getBLEDeviceServices(deviceId)
      }, 50);
    },
    fail: () => {
      _this.setData({
        bleConnected: 1
      })
      console.log("createBLEConnection failed.");
    }
  })
}

function bleDisconnect() {
  wx.closeBLEConnection({
    deviceId: _this.data.bleAddress,
    success: function(res) {
      _this.setData({
        bleConnected: 1
      })
    },
    fail: function() {
      console.log("closeBLEConnection failed.");
    }
  });
}

function bleSendData(data) {
  if (_this.data.bleConnected != 3) {
    wx.showToast({title: '蓝牙未连接',icon:'none'});
    return;
  }
  BleSDPParser.sendDatagram(data, _this.data.bleAddress);
}

function bleUpdateClick() {
  console.log('bleUpdateClick:', bmsUpdateStatus, hwVer);
  switch(bmsUpdateStatus) {
      case STATUS_UPDATE_SUCCESS:
        let bmsVersion = DataManager.bmsVersionInfo;
        //bmsVersion = 'JSDZ-BMSHW-001 JSDZ-BMSSW-007';
        if (hwVer == '000') {
          if (!bmsVersion) {
            wx.showModal({
              title:'BMS固件更新',
              content:'请先点击“获取版本”检测当前BMS版本,仅BMSSW-004及以上支持在线升级',
              showCancel: true,
              cancelText: '手动选择',
              confirmText:'确定',
              success(res) {
                if (res.cancel) {
                  wx.showLoading({title:'获取版本'})
                  bmsGetVersions(function success(res) {
                    wx.hideLoading();
                    if (res.data != null && res.data.code == 0) {
                      let versions = res.data.versions;
                      if (!_this.data.isAdmin) { versions = versions.filter((value, index, array) => {
                        return value.test == false;})
                      } 
                      wx.showActionSheet({
                        itemList: versions.map((value, index, array) => {return value.cn}),
                        success(res) {
                          console.log('select:', versions[res.tapIndex]);
                          hwVer = versions[res.tapIndex].value;
                        }
                      })
                    }
                    console.log('bmsGetVersions:', res);
                  }, 
                  function failCb(){
                    wx.hideLoading();
                  })
                }
              }
            })
            return
          }
          let hwArr = regexHw.exec(bmsVersion);
          let swArr = regexSw.exec(bmsVersion);
          let swVer = swArr.length > 1 ? parseInt(swArr[1]) : 0;
          hwVer = hwArr.length > 1 ? hwArr[1] : '000';
          if (swVer < 4) {
            wx.showModal({
              title:'BMS固件更新',
              content:'当前版本过低，仅BMSSW-004及以上版本支持在线升级',
              showCancel: false,
              confirmText:'确定'
            })
            return
          }
        }
        wx.showLoading({title:'检测更新'})
        bmsCheckUpdate(hwVer, (res)=> {
          wx.hideLoading();
          console.log(res)
          if (res.data.code == 0) {
            bmsUpdateStatus = STATUS_WAITING_FOR_DOWNLOAD;
            bmsUpdateInfo = res.data;
            _this.setData({bmsBtnUpdate: `版本${res.data.versionCode},点击下载`});
          } else {
            wx.showToast({title:`失败，code=${res.data.code}`, icon:'none'})
          }
        }, (res)=> {
          wx.hideLoading();
          wx.showToast({title:'请求失败!', icon:'none'})
        })
        hwVer = '000'; //恢复变量
        break;
      case STATUS_WAITING_FOR_DOWNLOAD:
        _this.setData({
          modalTitle:'BMS固件下载',
          modalContent:'正在下载固件',
          modalProgress: 0,
        })       
        _this.pgModal.showModal(); 
        if (bmsUpdateInfo != null) {
          downloadFile(bmsUpdateInfo.url, function successCb(res) {
            console.log('downloadFile:', res)
            //_this.pgModal.hideModal();
            bmsUpdateStatus = STATUS_DOWNLOAD_COMPLETED;
            _this.setData({
              bmsBtnUpdate: '点击更新',
              modalContent: '下载完成！',
              modalProgress: 100
            })
            readTempFile(res.tempFilePath);
          }, function failCb(res) {
            _this.setData({modalContent:'下载失败！'})
          }, function progressCb(res) {
            console.log(res)            
            _this.setData({modalProgress: res.progress})
          })
        } 
        break;
      case STATUS_DOWNLOAD_COMPLETED:
        bleSendData(packBMSCtrlCmd(BMSDataParser.CMD_BMS_UPDATE));
        break;
  }
}

function onProgressDialogConfirm(res) {
  console.log('onDialogConfirm:', res);
  if (bmsUpdateStatus == STATUS_DOWNLOAD_COMPLETED || bmsUpdateStatus == STATUS_UPDATE_SUCCESS) {
    _this.pgModal.hideModal();
  }
}
function onProgressDialogCancel(res) {
  console.log('onDialogCancel:', res);
  if (bmsUpdateStatus == STATUS_DOWNLOAD_COMPLETED) {
    _this.pgModal.hideModal();
  } else {
    bmsUpdateStatus = STATUS_UPDATE_SUCCESS;
      _this.setData({
        bmsBtnUpdate: 'BMS固件更新'
      })
      _this.pgModal.hideModal();
  }
}

function onWorkerMessage(content) {
  switch (content.msgType) {
    case 'CV':
      DataManager.infoList = content.data.infoList;
      DataManager.singleBatteryInfo = content.data.singleBatteryInfo;
      let [firstPageInfo, tempList] = _this.postProcessData();
      _this.setData({
        searchSuccess: true,
        infoList: firstPageInfo,
        circleData: _this.data.circleData,
        temperatureList: tempList,
        singleBatteryInfo: DataManager.singleBatteryInfo,
      });
      _this.drawBgCanvas();
      break;
    case 'MENU':
      console.log("onWorkerMessage,menu:", content.data);
      DataManager.batteryConfigValue = content.data.batteryConfigValue;
      _this.setData({
        searchSuccess: true,
        batteryConfigValue: DataManager.batteryConfigValue
      });
      wx.showToast({
        title: '刷新成功',
        icon: 'none',
      });
      break;
    case 'CMD_RESPONSE':
      let [cmd, result] = content.data;
      console.log("onWorkerMessage,response:", util.ab2Hex(result));
      let version = String.fromCharCode.apply(null, result);
      switch(cmd) {
        case BMSDataParser.CMD_VERSION:
          DataManager.bmsVersionInfo = version;
          _this.setData({bmsVersionInfo: version})
          break;
        case BMSDataParser.CMD_SET_MENU:
          wx.showToast({
            title: result[0] == 0 ? '设置成功' : '设置失败',
            icon: 'none'
          });
          break;
        case BMSDataParser.CMD_RESET:
          wx.showToast({
            title: result[0] == 0 ? '复位成功' : '复位失败',
            icon: 'none'
          });
          break;
        case BMSDataParser.CMD_POWER_OFF_CAUSE:
          if (result.length >= 8 && result[0] == 0) {
            var msg = '暂无关机信息';
            if ((result[7] & 0xFF) != 255) {
              var cause = parsePowerOffCause(result[7]);
              var offDate = [2000 + result[1], result[2], result[3]].join('-');
              var offTime = [result[4], result[5], result[6]].map(util.formatNumber).join(':');
              var msg = `上次关机时间：${offDate} ${offTime},关机原因：${cause}`;
            }               
            _this.setData({bmsVersionInfo:msg});
          }
          break;
        case BMSDataParser.CMD_BMS_UPDATE:
          processUpdateCmdResponse(result);
          break;
        case BMSDataParser.CMD_FLASH_ERASE:
          if (!_this.pgModal.isShow()) return;  // 用户取消
          if (result[0] == BMSDataParser.RESPONSE_SUCCESS) {
            bmsUpdateStatus = STATUS_ERASE_FLASH_SUCCESS;
            _this.setData({modalContent: '请保持手机蓝牙开启并尽量靠近电池箱，正在升级...(3/4)'})
            sRecIndex = 0;
            fdgOffset = 0;
            sendBMSHW();
          } else {
            _this.setData({modalContent: '升级失败，请点击取消并重新尝试'})
          }
          break;
        case BMSDataParser.CMD_UPDATE_RECORD:
          if (!_this.pgModal.isShow()) return;  // 用户取消
          if (result[0] == BMSDataParser.RESPONSE_SUCCESS) {
            bmsUpdateStatus = STATUS_FILE_TRANSPORT;
            sendBMSHW();
          } else {
            _this.setData({modalContent: '升级失败，请点击取消并重新尝试'})
          }
          break;
      }
      break;
  }
}

function sendBMSHW() {
  if (sRecIndex < sRecords.length) {
    let sRecord = Array.from(sRecords[sRecIndex]).map(util.ascii);
    BleSDPParser.sendFileDatagram(sRecord, sRecIndex < sRecords.length - 1, fdgOffset,  _this.data.bleAddress);
    fdgOffset += sRecord.length;
    sRecIndex++;
    _this.setData({modalProgress: Math.round(sRecIndex * 100 / sRecords.length)})
  }  
}

function readTempFile(tmpPath) {
  const fs = wx.getFileSystemManager();
  fs.readFile({filePath: tmpPath, encoding: 'utf-8', success(res) {
    sRecords = res.data.split(/\s+/);
    console.log('readSRecords:', sRecords.length)
    /*for (let i = 0; i < sRecords.length; i++) {
      console.log(i, sRecords[i], sRecords[i].length);
    }*/
  }, fail(res) {
    _this.setData({modalContent: '读取文件失败，请点击取消并重新尝试'})
  }})
}

function processUpdateCmdResponse(data) {
  switch(data[0]) {
    case BMSDataParser.RESPONSE_SUCCESS:
      bmsUpdateStatus = STATUS_PREPARE_TO_REBOOT;
      _this.setData({
        modalTitle:'BMS固件更新',
        modalContent: '请保持手机蓝牙开启并尽量靠近电池箱，正在重启...(1/4)',
        modalProgress: 0})
      _this.pgModal.showModal();
      break;
    case BMSDataParser.RESPONSE_STATUS_OTA_START:
      //if (!_this.pgModal.isShow()) return;  // 用户取消
      bmsUpdateStatus = STATUS_REBOOT_TO_BOOTLOADER;
      _this.setData({
        modalContent: '请保持手机蓝牙开启并尽量靠近电池箱，正在擦除Flash...(2/4)',
      })
      bleSendData(packBMSCtrlCmd(BMSDataParser.CMD_FLASH_ERASE));
      break;
    case BMSDataParser.RESPONSE_STATUS_OTA_END:
      _this.setData({modalContent: '恭喜！升级成功(4/4)'})
      bmsUpdateStatus = STATUS_UPDATE_SUCCESS;
      break;
    default:
      _this.setData({modalContent:'升级失败，请点击取消并重新尝试'})
      break;
  }
}

function parsePowerOffCause(data) {
  var cause = '未知原因';
  switch(data & 0xFF) {
    case 5:
      cause = '长按电源键超过5s';
      break;
    case 8:
      cause = '收到关机命令';
      break;
    case 0x0A:
      cause = '收到复位命令';
      break;
    case 24:
      cause = '电量低于20%持续超过24h';
      break;
    case 60:
      cause = '单体电压低于2.5V持续60s';
      break;
    case 120:
      cause = '电池待机未使用超过5天';
      break;
    case 255:
      cause = '暂无关机信息';
      break;
    default:
      cause = '未知原因';
      break;
  }
  return cause;
}

function bleParamRecord() {
  let infoList = DataManager.infoList.slice();
  let cellVolts = DataManager.singleBatteryInfo.map((element) => {return parseFloat(element)});
  let cvData = {}, paramData = {}, logData = {};
  _this.setData({ isRecording : true});
  for (let i = 0; i < infoList.length; i++) {
    cvData[infoList[i].key] = infoList[i].value;
  }
  cvData['最高单体电压'] = Math.max(...cellVolts);
  cvData['最低单体电压'] = Math.min(...cellVolts);
  let paramLen = _this.data.batteryConfigValue.length < _this.data.batteryConfigKey.length 
  ? _this.data.batteryConfigValue.length : _this.data.batteryConfigKey.length;
  for (let i = 0; i < paramLen; i++) {
    paramData[_this.data.batteryConfigKey[i]] = DataManager.batteryConfigValue[i];
  }
  logData['cv_data'] = cvData;
  logData['cell_volt'] = cellVolts;
  logData['param'] = paramData;
  //console.log("saveParam:", JSON.stringify(logData));
  let name = _this.data.bleName;
  //console.log("path:", wx.env.USER_DATA_PATH, name);
  const fs = wx.getFileSystemManager();
  fs.writeFile({ filePath : `${wx.env.USER_DATA_PATH}/${name}.txt`,
    data: JSON.stringify(logData, null, 4),
    encoding: 'utf-8',
    success : (res) => {
      fileUpload('bleLog', `${wx.env.USER_DATA_PATH}/${name}.txt`, function successCb(res){
        let result = JSON.parse(res.data);
        console.log('upload successCb:', res)
        if (res.data != null && result['code'] == 0) {
          wx.showToast({ title: `${result['desc']}`, icon: null });
        } else {
          wx.showToast({ title: `失败code=${result['code']}`, icon: null });
        }          
        _this.setData({ isRecording: false });
      }, function failCb(res) {
          console.log('upload failCb:', res);
          wx.showToast({ title: '上传失败', icon: null });
          _this.setData({ isRecording: false });
      }, function progressCb(res) {
          //console.log('progress', res);
      });
    },
    fail : (res) => {
      wx.showToast({title:'保存失败', icon : null});
      _this.setData({ isRecording: false });
    }});
    /*fs.readFile({filePath : `${wx.env.USER_DATA_PATH}/${name}.log`,
      encoding : 'utf-8',
      success : (res) => {
        console.log('read:', res.data);
      }, fail : (res) => {

      }});*/
}

function testData(_home) {
  _this = _home
  let cv = '4116450100002D0D0FD0010102263312000002130000000000071211E0E0E01370945C944D943E942F947A945C943E943E945C945C944D944D945C946B12071C173B360BB818F02B';
  BleSDPParser.bufferData(BleSDPParser.hex2AB(cv));
  // let param =
  //   '411645010000B41F4650009655F0003271487530A028A60480E80037003C0000000E006E00FA0000FFFBFFEC0DAC004B0055FFFB0005001F0BB8033E12071C173B360BB8A4F12B';
  let param = '4116450100000E1F4650009655F0003271487530A028A60480E80037003C0000000E006E00FA0000FFFBFFEC0DAC004B0055FFFB0005001F0BB8033E43060E0E3'
   + '426001C000700643237A21C88B805DC908803E8000000005D00BF9F5D034436001E4A532D0D000C93D1F12B';
    BleSDPParser.bufferData(BleSDPParser.hex2AB(param));
  _this.setData({bleName:'JSDZ_001',
                bleAddress: 'AABBCC'});
  /*let sRecord = 'S2247F7F00FFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFC0BDC0BDC0BDC0BDC0BDC0BDC0BDC0BD05';
  console.log('sRecord:', sRecord);
  console.log('array:', Array.from(sRecord).map(util.ascii));
  BleSDPParser.sendFileDatagram(Array.from(sRecord).map(util.ascii), true, 0, 'aaa');*/
  //console.log('toByte:', util.ab2Hex(toBatteryConfigArray(_this.data.batteryConfigValue)));
}

export {
  registerBLEDataListener,
  bleConnect,
  bleDisconnect,
  bleSendData,
  bleUpdateClick,
  onProgressDialogConfirm,
  onProgressDialogCancel,
  bleParamRecord,
  testData, 
  onWorkerMessage
}