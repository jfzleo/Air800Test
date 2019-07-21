const event = require('../../utils/event');
import { parseCtrlMsg, parseWarningMsg } from '../data/ctrlwarningparser';
import {ab2Hex, byte2SignedInt, bytes2Int, bytes2SignedInt,
  sortArrList, formatNumber, formatDate, formatTime, formatDateTimeMilS} from '../../utils/util';

const BMSDataParser = {
  CMD_UPDATE_RECORD : 0x02,    // 更新App程序
  CMD_FLASH_ERASE : 0x03,   // 擦写PFlash
  CMD_BMS_UPDATE : 0x04,    // OTA升级
  CMD_VERSION : 0x05,    // 获取版本
  CMD_GET_MENU: 0x06,    // 获取菜单设置
  CMD_CALIBRATE: 0x07,    // 电池校准
  CMD_POWER_OFF: 0x08,    // 断电
  CMD_POWER_OFF_CAUSE: 0x09,     // 获取关机原因
  CMD_RESET: 0x0A,    // 复位
  CMD_SET_MENU: 0x0F,    // 设置菜单
  CMD_INIT_LOG: 0x0D,    // 初始化日志

  RESPONSE_CMD_FLAG: 0x0B,
  RESPONSE_CV_FLAG: 0x0F,
  RESPONSE_MENU_FLAG: 0x1F,
  RESPONSE_SUCCESS: 0x00,
  RESPONSE_STATUS_OTA_START : 0xF1,  // OTA升级启动
  RESPONSE_STATUS_OTA_END : 0xF2,  // OTA升级启动
  RESPONSE_CMD_FORMAT_ERROR: 0x01,
  ERROR_INIT_6803_FAILURE: 0x0D // 初始化LTC6803失败
}

const sendBuff = new Uint8Array(121);
const scales = {0 : 100, 1: 5, 2: 100, 3 : 5, 4: 10000, 5: 10000, 6: 10000, 7: 10000, 8:10000, 18:100, 24:10000, 25:10, 34:100,
  37:10000, 38:10000, 39:10000, 40:10000, 41:10000, 42:100, 47:10, 48:10};
const signed = [9, 10, 11, 15, 16, 17, 19, 20, 21, 22, 32, 35, 36, 45];
const byteN = {26:1, 27:1, 28:1, 29:1, 30:1, 31:1, 35:1, 36:1, 42:4, 43:4, 44:4, 46:6};
const offsets = {26:2000};

/**
 * 解析具体的报文数据
 * 根据不同起始符分类报文内容，并做相应的处理
 */
function parseBMSData(content) {
  if (!content) {
    console.error("parseBMSData content is empty")
    return
  }
  //console.log(`parseBMSData:${ab2Hex(content)}`);
  switch(content[0]) {
    case BMSDataParser.RESPONSE_CV_FLAG: {
      // 去掉报文头部、0x0F、0xF0开始结束符，数据内部CRC
      let rawData = content.slice(1, content.length - 2)
      let batInfo = parseBatInfo(rawData)
      //console.log("batInfo", batInfo);
      event.post("BLE_DATA", {msgType:'CV', data:batInfo});
    }
    break;
    case BMSDataParser.RESPONSE_MENU_FLAG: {
      // 仅仅去掉报文头部,保留0x1F、0xF1开始结束符以及数据内部CRC和onenet数据格式保持一致
      console.log(`parseBMSMenu:${ab2Hex(content)}`);
      if(content.length < 63) {
        console.error(`parseBMSData menu data format error:datLen=${content.length}`);
      } else {
        let batParam = parseParamInfo(content);
        event.post("BLE_DATA", {msgType:'MENU', data:batParam});
        //EventBus.getDefault().post(MessageEvent(MessageEvent.MESSAGE_UPDATE_MENU))
      }
    }
    break;
    case BMSDataParser.RESPONSE_CMD_FLAG : {
      if(content.length < 5) {
        console.error(`parseBMSData cmd data format error:datLen=${content.length}`);
      } else {
        if(content[1] == content[2] && content[1] == content[3] && content[2] == content[3]){
          event.post("BLE_DATA", {msgType:'CMD_RESPONSE', data:[content[1], content.slice(4, content.length)]});
          // EventBus.getDefault().post(MessageEvent(MessageEvent.MESSAGE_UPDATE_CMD_RESPONSE,
          //   Pair(content[1], content.slice(4 , content.length))));
        }      
      }
    }
    break;
  }
}
/**
 *  解析电池电压电流实时参数，需要预先去掉报文头、内容的开始结束标志以及CRC
 */
function parseBatInfo(rawData) {
  let infoList = [],
  temperature = [],
  singleBatteryInfo = [];
  let date = new Date();
  let current = formatDateTimeMilS(date);
  infoList.push({
    key: '最后更新',
    value: current,
    sequence: 0
  }); 
  let ctrlMsg = parseCtrlMsg(rawData[0]);
  ctrlMsg = ctrlMsg.length > 0 ? ctrlMsg.join(',') : "无";
  infoList.push({
    key: '控制信息',
    value: `${rawData[0].toString(16).toUpperCase()} ${ctrlMsg}`,
    sequence: 1
  });
  let warnMsg = parseWarningMsg((rawData[1] << 8) + rawData[2]);
  warnMsg = warnMsg.length > 0 ? warnMsg.join(',') : "无";
  infoList.push({
    key: '告警信息',
    value: `${bytes2Int(rawData[1], rawData[2]).toString(16).toUpperCase()} ${warnMsg}`,
    sequence: 2
  });
  infoList.push({
    key: '剩余电量',
    value: bytes2Int(rawData[3], rawData[4]) / 10.0 + ' AH',
    sequence: 3
  });
  infoList.push({
    key: '剩余电量',
    value: rawData[5] + '%',
    sequence: 4
  });
  infoList.push({
    key: '最高温度',
    value: byte2SignedInt(rawData[6]),
    sequence: 5
  });
  temperature.push({
    value: byte2SignedInt(rawData[17]),
    sequence: 1
  });
  temperature.push({
    value: byte2SignedInt(rawData[18]),
    sequence: 2
  });
  temperature.push({
    value: byte2SignedInt(rawData[19]),
    sequence: 3
  });
  temperature.push({
    value: byte2SignedInt(rawData[20]),
    sequence: 4
  });
  temperature.push({
    value: byte2SignedInt(rawData[21]),
    sequence: 5
  });
  infoList.push({
    key: '输出功率',
    value: bytes2Int(rawData[7], rawData[8]),
    sequence: 7
  });
  infoList.push({
    key: '总电压值',
    value: bytes2Int(rawData[9], rawData[10]) / 10.0,    // 单位为0.1V
    sequence: 8
  });
  infoList.push({
    key: '总电流值',
    value: bytes2Int(rawData[11], rawData[12]) / 10.0,   // 单位为0.1A
    sequence: 9
  });
  infoList.push({
    key: '充电电流',
    value: bytes2Int(rawData[13], rawData[14]) / 100.0,     // 单位为0.01A
    sequence: 10
  });
  infoList.push({
    key: '放电电流',
    value: bytes2Int(rawData[15], rawData[16]) / 100.0,  // 单位为0.01A
    sequence: 11
  });
  let V_clamp = bytes2Int(rawData[22], rawData[23]);
  // 单体电压
  let vLen = (rawData.length - 8 - 24) / 2;
  for (let i = 0; i < vLen; i++) {
    let value = bytes2Int(rawData[24 + i * 2], rawData[24 + i * 2 + 1]);
    value = value / 10000;
    singleBatteryInfo.push(value.toFixed(2));
  }
  temperature.sort(sortArrList('sequence'));
  let temperatureValue = [];
  for (let j = 0; j < temperature.length; j++) {
    temperatureValue.push(temperature[j].value);
  }
  infoList.push({
    key: '各温度值',
    value: temperatureValue.join(','),
    sequence: 6
  });

  let daysLeft = bytes2SignedInt(rawData[rawData.length - 2], rawData[rawData.length - 1]);
  infoList.push({
    key:'剩余天数',
    value: daysLeft,
    sequence: 12
  });
  infoList.sort(sortArrList('sequence'));

  return { infoList : infoList,
           singleBatteryInfo: singleBatteryInfo,
           }
}

/**
 * 解析菜单设置数据，只需要预先去掉报文头，内容的开始结束标志以及CRC保留透传
 * 报文内容为：
 *          1F ...{60}... CRC F1
 */
function parseParamInfo(rawData) {
  //填充配置参数
  let batteryConfigValue = [];
  if (rawData) {
    let resultValue = new Uint8Array(rawData);
    resultValue = resultValue.slice(1, resultValue.length -2);
    //resultValue.shift();
    //resultValue.splice(resultValue.length - 2, 2);
    let count = 0;
    for (let i = 0; i < resultValue.length; count++) {
      let value = resultValue[i++];
      if (count in byteN) {
        if (byteN[count] == 1) {

        } else if (byteN[count] == 4) {
          value = (value << 24) | (resultValue[i++] << 16) | (resultValue[i++] << 8) | resultValue[i++]; 
        } else if (byteN[count] == 6) {
          value = String.fromCharCode.apply(null, resultValue.slice(i -1, i + 2));
          //console.log('deviceId:', i, resultValue.slice(i - 1, i + 6));
          let numStr = '0000' + resultValue.slice(i + 2, i + 5).reduce((x, y)=> { return (x << 8) + y;});
          value += numStr.substring(numStr.length - 4);
          i += 5;
        } 
      } else {
        value = (value << 8) + resultValue[i++]
      }
      if (signed.indexOf(count) >= 0) {
        if (count in byteN) { // 单字节数据处理
          if (value > 127 ) value -= 256;
        } else {  // 双字节数据处理
          if (value > 32767) value -= 65536;
        }
      }
      if (count in scales) {
        value /= scales[count];
      }
      //满电电压有两种模式，如果大于2000则原值大于20000视为单体电压,单位0.1mv
      if (count == 25 && value > 2000) value /= 1000; 

      if (count in offsets) {
        value += offsets[count]
      }        
      batteryConfigValue.push(value);
    }
    if (batteryConfigValue.length >= 47) {
      let tmpDate = new Date(batteryConfigValue[43] * 1000);
      let rentDateStr = formatDate(tmpDate);
      let rentTimeStr = formatTime(tmpDate);
      tmpDate = new Date(batteryConfigValue[44] * 1000);
      let utcDateStr = formatDate(tmpDate);
      let utcTimeStr = formatTime(tmpDate);
      batteryConfigValue.splice(43, 2, rentDateStr, rentTimeStr, utcDateStr, utcTimeStr);
    }
    //年月日
    //console.log('dateArray:', batteryConfigValue, batteryConfigValue.slice(26, 29));
    let dateStr = batteryConfigValue.slice(26, 29).map((x, index, array) => {if (x < 10) return '0' + x; return x;}).join('-');
    //时分秒
    let timeStr = batteryConfigValue.slice(29, 32).map((x)=>{if (x < 10) return '0' + x; return x;}).join(':');
    //console.log('dateStr:', dateStr, 'timeStr:', timeStr);
    batteryConfigValue.splice(26, 6, dateStr, timeStr);
    
    console.log("parseParamInfo", batteryConfigValue);
  }
  return {
    batteryConfigValue: batteryConfigValue
    };
}
/**
 * 拼装BMS控制命令，连续3个命令字节，包括：
 * 1、菜单获取
 * 2、复位
 * 3、关机
 * 4、版本获取
 * 5、电池校验
 */
function packBMSCtrlCmd(cmd) {
  return new Uint8Array([cmd, cmd, cmd]);
}

/**
 * 以3个0x0F字节开头，数据长度52(不带时间）/60字节(带时间）+数据CRC
 */
function packMenuSetCmd(rawData){
  let index = 0;
  for (let i = 0; i < 3; i++) {
    sendBuff[index++] = BMSDataParser.CMD_SET_MENU;
  }
  let CRC = 0;
  for (let value of rawData) {
    sendBuff[index++] = value;
    CRC = (CRC + value) & 0xFF;
  }
  sendBuff[index++] = CRC & 0xFF;
  return sendBuff.slice(0, index);
}
/**
 * batteryConfigValue数组转菜单设置报文数据，数据长度52(不带时间）/60字节(带时间）
 * V2设置：100字节
 */
function toBatteryConfigArray(paramList) {
  let batteryConfigValue = paramList.slice();
  if (batteryConfigValue.length > 28) {   // 恢复内部时钟
    //let dateArr = batteryConfigValue[26].split("-");
    //let timeArr = batteryConfigValue[27].split(":");
    let now = new Date();
    let dateArr = [now.getFullYear(), now.getMonth() + 1, now.getDate()]; // getMonth={0~11}
    let timeArr = [now.getHours(), now.getMinutes(), now.getSeconds()];
    batteryConfigValue.splice(26, 2, dateArr[0], dateArr[1], dateArr[2], timeArr[0], timeArr[1], timeArr[2]);     
  }
  if (batteryConfigValue.length > 47) {   // 恢复租赁时间戳和utc时间戳,注意单位是S
    let rentTime = Date.parse(`${batteryConfigValue[43]}T${batteryConfigValue[44]}`) / 1000;
    let utcTime = new Date().getTime() / 1000;
    batteryConfigValue.splice(43, 4, rentTime, utcTime);    
  }
  let bytes = new Uint8Array(100);
  if (batteryConfigValue.length < 34) {  // 29 - 2 + 6 = 33个参数,V1设置为60个字节且有串口最大接收100字节的限制,V2设置为100个字节
    bytes = new Uint8Array(60)
  } 
  let index = 0;
  for (let i = 0; i < batteryConfigValue.length; i++) {
    if (i in offsets) {
      batteryConfigValue[i] -= offsets[i];
    }
    if (i in scales) {
      batteryConfigValue[i] *= scales[i];
    }
    // 满电电压有两种模式，如果小于6.5535V则视为单体电压,单位0.1mv
    if (i == 25 && batteryConfigValue[i] < 65.535) batteryConfigValue[i] *= 1000;     

    if (i in signed) {
      let value = batteryConfigValue[i];
      if (byteN[i] == 1) {
        if (value < 0) {
          value += 256;
        }
      } else if (byteN[i] == 2) {        
        if (value < 0) {
          value += 65536
        }
      }
    }
    if (i in byteN) {
      if (byteN[i] == 6) {
        for (let j = 0; j < 3; j++){
          bytes[index++] = batteryConfigValue[i].charCodeAt(j);
        }
        let numVal = parseInt(batteryConfigValue[i].substring(3));
        console.log('deviceId numVal:', numVal);
        for (let j = 0; j < 3; j++) {
          bytes[index++] = (numVal >> (2 - j) * 8) & 0xFF;
        }
        console.log(bytes.slice(index - 3, index))
      } else if (byteN[i] == 4) {
        for (let j = 0; j < 4; j++) {
          bytes[index++] = (batteryConfigValue[i] >> (3 - j) * 8) & 0xFF;
        }
      } else if (byteN[i] == 1) {
        bytes[index++] = batteryConfigValue[i];
      }
    } else {
      bytes[index++] = batteryConfigValue[i] >> 8;
      bytes[index++] = batteryConfigValue[i];
    }
  }
  return bytes
}
export { BMSDataParser, 
   parseBMSData, 
   packBMSCtrlCmd,
   packMenuSetCmd, 
   toBatteryConfigArray,
   parseParamInfo};