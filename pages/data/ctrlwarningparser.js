
const CTRL_CHARGE = 0x0080;  // 过充保护/低温保护 1正常0触发
const CTRL_DISCHARGE = 0x0040; // 过放保护/低温保护 1正常0触发
const CTRL_OVER_TEMP = 0x0020; // 过温保护 0正常1触发
const CTRL_BELL = 0x0010;   // 蜂鸣器状态 1正常0触发
const CTRL_CALIBRATE = 0x0001;   // 电量校准 0正常1触发

const CTRL_VALUE = [
  CTRL_CHARGE,  // 过充保护/低温保护 1正常0触发
  CTRL_DISCHARGE, // 过放保护/低温保护 1正常0触发
  CTRL_OVER_TEMP, // 过温保护 0正常1触发
  CTRL_BELL,   // 蜂鸣器状态 1正常0触发
  CTRL_CALIBRATE   // 电量校准 0正常1触发
]
const ctrlMsgStr = [
  "充电保护开启",
  "放电保护开启",
  "过温保护开启",
  "蜂鸣器开启",
  "电量校准开始",
]

const WARNING_CHARGE_OVER_VOLTAGE_DIFF  = 0x0800; // 充电压差过高
const WARNING_LOW_TEMP_DISCHARGE = 0x0400;  // 低温门限2（放电）告警
const WARNING_LOW_TEMP_CHARGE = 0x0200;  // 低温门限1（充电）告警
const WARNING_OVER_VOLTAGE_DIFF = 0x0100;  // 压差过大警告信息
const WARNING_SOC_LOW = 0x0080;  // 电量过低警告信息
const WARNING_OVER_DISCHARGE_CURRENT_1 = 0x0040;  // 放电电流过高门限1警告信息
const WARNING_OVER_TEMP_1 = 0x0020;  // 温度过高门限1警告信息
const WARNING_OVER_DISCHARGE = 0x0010; // 电量耗尽警告信息
const WARNING_OVER_CHARGE = 0x0008;  // 充电过量警告信息
const WARNING_OVER_CHARGE_CURRENT = 0x0004; // 充电过流警告信息
const WARNING_OVER_DISCHARGE_CURRENT_2 = 0x0002 ;  // 放电电流过高门限2警告信息
const WARNING_OVER_TEMP_2 = 0x0001;  // 温度过高门限2警告信息

const WARNING_VALUE = [
  WARNING_CHARGE_OVER_VOLTAGE_DIFF, // 充电压差过高
  WARNING_LOW_TEMP_DISCHARGE,  // 低温门限2（放电）告警
  WARNING_LOW_TEMP_CHARGE,  // 低温门限1（充电）告警
  WARNING_OVER_VOLTAGE_DIFF,  // 压差过大警告信息
  WARNING_SOC_LOW,  // 电量过低警告信息
  WARNING_OVER_DISCHARGE_CURRENT_1,  // 放电电流过高门限1警告信息
  WARNING_OVER_TEMP_1,  // 温度过高门限1警告信息
  WARNING_OVER_DISCHARGE, // 电量耗尽警告信息
  WARNING_OVER_CHARGE,  // 充电过量警告信息
  WARNING_OVER_CHARGE_CURRENT, // 充电过流警告信息
  WARNING_OVER_DISCHARGE_CURRENT_2 ,  // 放电电流过高门限2警告信息
  WARNING_OVER_TEMP_2,  // 温度过高门限2警告信息
]

const warningMsgStr = [
 "充电压差过高", // 充电压差过高
 "低温放电保护",  // 低温门限2（放电）告警
 "低温充电保护",  // 低温门限1（充电）告警
 "压差过高",  // 压差过大警告信息
 "电量过低",  // 电量过低警告信息
 "放电过流",  // 放电电流过高门限1警告信息
 "温度过高",  // 温度过高门限1警告信息
 "电量耗尽", // 电量耗尽警告信息
 "电池过充",  // 充电过量警告信息
 "充电过流", // 充电过流警告信息
 "放电严重过流",  // 放电电流过高门限2警告信息
 "温度严重过高",  // 温度过高门限2警告信息
]

function parseCtrlMsg(ctrlCode) {
  var count = 0;
  var ctrlMsg = [];
  for (let i = 0; i < CTRL_VALUE.length; i++) {
    if ([0, 1, 3].indexOf(i) != -1) {
      if ((CTRL_VALUE[i] & ctrlCode) == 0) {
        ctrlMsg.push(ctrlMsgStr[i]);
        if (++count >= 2) break;
      }
    } else {
      if ((CTRL_VALUE[i] & ctrlCode) > 0) {
        ctrlMsg.push(ctrlMsgStr[i]);
        if (++count >= 2) break;
      }
    } 
  }
  return ctrlMsg;
}
function parseWarningMsg(warningCode) {
  var count = 0;
  var warningMsg = [];
  for(let i = 0; i < WARNING_VALUE.length; i++) {
    if ((WARNING_VALUE[i] & warningCode) > 0) {      
      warningMsg.push(warningMsgStr[i]);
      if (++count >= 2) break;
    }
  }
  return warningMsg;
}

export {
  parseCtrlMsg,
  parseWarningMsg
}