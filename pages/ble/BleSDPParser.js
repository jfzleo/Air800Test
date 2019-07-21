import {BleSDP} from './BleSDP.js';
import { BleProxyJDY} from './BleDeviceProxy.js';
import {parseBMSData, BMSDataParser} from './BleDataParser.js';


function charToByte(c) {
  return "0123456789ABCDEF".indexOf(c)
}

// 16进度字符串示例转ArrayBuffer
function hex2AB(hexStr) {
  if (hexStr) {
    let upperBytes = hexStr.toUpperCase();
    let len = upperBytes.length / 2;
    let bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = charToByte(upperBytes[2 * i]) << 4 | charToByte(upperBytes[2 * i + 1])
    }
    return bytes;
  }
  return null;
}
// ArrayBuffer转16进度字符串示例
function ab2Hex(buffer) {
  const hexArr = Array.prototype.map.call(
    new Uint8Array(buffer),
    function (byte) {
      return ('00' + byte.toString(16)).slice(-2)
    }
  )
  return hexArr.join('')
}

// 在 Worker 线程执行上下文会全局暴露一个 worker 对象，直接调用 worker.onMeesage/postMessage 即可
// 注意 Worker无法require其它路径下的代码
var bEscape = false;
var buffer = new ArrayBuffer(512);
var buffData = new Uint8Array(buffer);
var sdpBuff = new Uint8Array(256);
var escapeBuffer = new Uint8Array((BleSDP.PACKAGE_MAX_LEN + BleSDP.HEADER_LEN) * 2 + 2);
var sendSDPBuf = new Uint8Array(BleSDP.PACKAGE_MAX_LEN + BleSDP.HEADER_LEN);
var dataLen = 0;
var bStart = false;

/*worker.onMessage(function (res) {
  //console.log("worker:", res);
  if (res.type == 'bleRawData') {
    //console.log(`data=${ab2Hex(res.value)}`); 
    bufferData(res.value);    
    // worker.postMessage({
    //   type: "Response",
    //   len: res.value.byteLength
    // })
  }
});
*/

/**
 * 识别报文开始和结束标志，提取出转义的完整报文
 * 获取的结果已经去掉开始结束符
 */
function bufferData(rawData) {
  let byteArray = new Uint8Array(rawData);
  for (let byte of byteArray) {
    switch (byte) {
      case BleSDP.START_FLAG: {
        bStart = true;
        dataLen = 0;
      }
        break;
      case BleSDP.END_FLAG: {
        if (bStart) {
          bStart = false
          parseData(buffData.slice(0, dataLen));
        }
      }
        break;
      default: {
        if (bStart && dataLen < buffData.length) {
          buffData[dataLen++] = byte;
        }
      }
        break;
    }
  }
}
/**
 * 对接收的完整转义报文进行解析，包含以下步骤：
 * 1、反转义
 * 2、校验和校验
 * 3、提取报文内容
 * 将报文内容交由下一级数据BMSDataParser进行处理
 */
function parseData(array) {
  //console.log(`parseData:${ab2Hex(array)}`)
  let sdp = revertEscape(array)
  if (!checkCRC(sdp)) return
  parseBMSData(sdp.slice(BleSDP.HEADER_LEN, sdp.byteLength))
}
/**
 * 校验和校验
 */
function checkCRC(sdp) {
  if (sdp.length > BleSDP.HEADER_LEN) { // 校验CRC
    let CRC = 0
    for (let i = 0; i < BleSDP.HEADER_LEN - 1; i++) {
      CRC = (CRC + sdp[i]) & 0xFF;
    }
    for (let i = BleSDP.HEADER_LEN; i < sdp.length; i++) {
      CRC = (CRC + sdp[i]) & 0xFF;
    }
    if (CRC == sdp[BleSDP.HEADER_LEN - 1]) {
      return true
    } else {
      console.error(`parseData CRC does not match,sdp=${sdp[BleSDP.HEADER_LEN - 1]},CRC=${CRC}`)
    }
  } else {
    console.error(`parseData, format error,len=${sdp.length}`)
  }
  return false
}


/**
 * 解析报文时用于反转义，提取出原始带报文头的报文数据
 */
function revertEscape(array) {
  bEscape = false
  let index = 0;
  for (let byte of array) {
    if (byte == BleSDP.ESCAPE) {
      bEscape = true
    } else {
      if (bEscape) {
        bEscape = false
        sdpBuff[index] = byte + BleSDP.ESCAPE_DIFF;
      } else {
        sdpBuff[index] = byte
      }
      index++
    }
  }
  return sdpBuff.slice(0, index);
}
/**
 * 将待发送的升级文件data进行封装，文件按行发送，每行都不会超出127字符，
 * 所以无需进行分包处理，但是需要处理MF与offset字段，便于出错重传
 * @param data Uint8Array，如果是字符串，需要先进行类型转换
 * @param MF 是否还有更多分片
 * @param offset 相对于报文起始的偏移字节数
 */
function sendFileDatagram(data, MF, offset, deviceId) {
  //console.log('sendFDG:', MF, offset, data.length, data);
  let len = data.length,
  index = BleSDP.HEADER_LEN,
  j = 0,
  CRC = 0;
  // 处理最后剩余数据
  sendSDPBuf[0] = BleSDP.HEADER_FIRST;
  sendSDPBuf[1] = len + BleSDP.HEADER_LEN + 3;
  if (MF) sendSDPBuf[2] = BleSDP.PROTOCOL_FILE_MF;
  else sendSDPBuf[2] = BleSDP.PROTOCOL_FILE;
  sendSDPBuf[3] = offset >> 8;
  sendSDPBuf[4] = offset & 0xFF;
  CRC = 0;
  for (j = 0; j < 3; j++) {
    sendSDPBuf[index++] = BMSDataParser.CMD_UPDATE_RECORD
    CRC += BMSDataParser.CMD_UPDATE_RECORD
  }
  for (j = 0; j < len; j++) {
    sendSDPBuf[index++] = data[j]
    CRC += data[j]
  }
  j = 0;
  while (j < BleSDP.HEADER_LEN - 1) {
    CRC += sendSDPBuf[j];  // 加上头部校验
    j++;
  }
  sendSDPBuf[5] = CRC & 0xFF;
  //console.log('CRC:', CRC, sendSDPBuf[5]);
  sendEscapeData(sendSDPBuf, index, deviceId);
}
/**
 * 将待发送的数据data进行分包（如果大于最大报文长度）分别添加报文头部并且发送转义后的报文数据
 */
function sendDatagram(data, deviceId) {
  let len = data.length,
  packNum = (len / BleSDP.PACKAGE_MAX_LEN) >> 0,    // 注意需要整除，js默认为number浮点数
  leftNum = len % BleSDP.PACKAGE_MAX_LEN,
  i = 0,
  j = 0,
  CRC = 0;
  // 处理整包部分
  sendSDPBuf[0] = BleSDP.HEADER_FIRST;
  sendSDPBuf[1] = BleSDP.PACKAGE_MAX_LEN + BleSDP.HEADER_LEN;
  sendSDPBuf[2] = BleSDP.PROTOCOL_CV_MF;
  i = 0;
  while (i < packNum) {
    CRC = 0;
    sendSDPBuf[3] = (i * BleSDP.PACKAGE_MAX_LEN) >> 8;
    sendSDPBuf[4] = i * BleSDP.PACKAGE_MAX_LEN;
    j = 0;
    while (j < BleSDP.PACKAGE_MAX_LEN) {
      sendSDPBuf[BleSDP.HEADER_LEN + j] = data[i * BleSDP.PACKAGE_MAX_LEN + j]
      CRC = (CRC + data[i * BleSDP.PACKAGE_MAX_LEN + j]) & 0xFF;
      j++;
    }
    j = 0;
    while (j < BleSDP.HEADER_LEN - 1) {
      CRC = (CRC + sendSDPBuf[j]) & 0xFF; // 加上头部校验
      j++;
    }
    sendSDPBuf[BleSDP.HEADER_LEN - 1] = CRC & 0xFF;
    sendEscapeData(sendSDPBuf, BleSDP.PACKAGE_MAX_LEN + BleSDP.HEADER_LEN);
    i++;
  }

  // 处理最后剩余数据
  sendSDPBuf[0] = BleSDP.HEADER_FIRST;
  sendSDPBuf[1] = leftNum + BleSDP.HEADER_LEN;
  sendSDPBuf[2] = BleSDP.PROTOCOL_CV;
  sendSDPBuf[3] = (packNum * BleSDP.PACKAGE_MAX_LEN) >> 8;
  sendSDPBuf[4] = packNum * BleSDP.PACKAGE_MAX_LEN;
  CRC = 0;
  j = 0;
  while (j < leftNum) {
    sendSDPBuf[6 + j] = data[packNum * BleSDP.PACKAGE_MAX_LEN + j];
    CRC = (CRC + data[packNum * BleSDP.PACKAGE_MAX_LEN + j]) & 0xFF;
    j++;
  }
  j = 0;
  while (j < BleSDP.HEADER_LEN - 1) {
    CRC = (CRC + sendSDPBuf[j]) & 0xFF;  // 加上头部校验
    j++;
  }
  sendSDPBuf[5] = CRC & 0xFF;
  sendEscapeData(sendSDPBuf, leftNum + BleSDP.HEADER_LEN, deviceId);
}
/**
 * 发送转义后的报文数据
 */
function sendEscapeData(data, len, deviceId) {
  console.log(`sendEscapeData len:${len},${ab2Hex(data.slice(0, len))}`)
  let index = 1;
  escapeBuffer[0] = BleSDP.START_FLAG;
  for (let i = 0; i < len; i++) {
    switch(data[i]) {
      case BleSDP.START_FLAG:
      case BleSDP.END_FLAG:
      case BleSDP.ESCAPE: {
        escapeBuffer[index++] = BleSDP.ESCAPE;
        escapeBuffer[index++] = data[i] - BleSDP.ESCAPE_DIFF;}
        break;
      default:
        escapeBuffer[index++] = data[i];
        break;
    }
  }
  escapeBuffer[index++] = BleSDP.END_FLAG
  BleProxyJDY.getInstance().sendData(deviceId, escapeBuffer.slice(0, index));
}

export { 
  bufferData, 
  charToByte, 
  hex2AB, 
  sendDatagram,
  sendFileDatagram}