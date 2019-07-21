const BleSDP = {
  START_FLAG: 0x41,
  END_FLAG: 0x2B,
  ESCAPE: 0x2D,
  ESCAPE_DIFF: 0x20,
  HEADER_LEN: 0x06,

  VERSION: 0x01,      // 协议版本号
  PROTOCOL_CV: 0x01,   // 电压电流采集协议
  PACKAGE_MAX_LEN: 121,   // 有效数据最大长度
  HEADER_FIRST: 0x01 << 4 | 0x06,
  PROTOCOL_CV_MF: 0x10 | 0x01,
  PROTOCOL_FILE : 0x02, // 文件数据传输
  PROTOCOL_FILE_MF: 0x10 | 0x02 
}

export {BleSDP};