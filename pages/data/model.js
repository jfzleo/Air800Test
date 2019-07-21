import { parseCtrlMsg, parseWarningMsg } from 'ctrlwarningparser';
import {parseParamInfo} from '../ble/BleDataParser.js'

var DataManager = (function () {
  var privateVar = '';

  function sortArrList(propertyName) {
    return function (object1, object2) {
      var value1 = object1[propertyName];
      var value2 = object2[propertyName];
      if (value1 < value2) {
        return -1;
      } else if (value1 > value2) {
        return 1;
      } else {
        return 0;
      }
    }
  }

  return { // public interface
    infoListTotal: [],
    infoList: [],
    temperature: [],
    singleBatteryInfo: [],
    batteryConfigValue: [],
    GPSInfoList: [],
    batterySpeed: [],
    lat: null,
    lon: null,
    bmsVersionInfo: null,

    parseInfoInternet: function (result) {
      // all private members are accesible here
      if (result == null) return;
      let _this = this;
      let data = result.data.datastreams, 
        infoListTotal = _this.infoListTotal;
        infoListTotal.length = 0;
      for (let i = 0; i < data.length; i++) {
        //续航里程
        if (data[i].id == 'S_left') {
          let value = (data[i].datapoints[0].value / 1000).toFixed(1);
          infoListTotal.push({
            key: '续航里程',
            value: parseFloat(value),
          });
        }

        //总里程值
        if (data[i].id == 'S_total') {
          let value = (data[i].datapoints[0].value / 1000).toFixed(1);
          infoListTotal.push({
            key: '总里程值',
            value: parseFloat(value),
          });
        }

        //基本信息 单芯信息
        if (data[i].id == 'bat_info') {
          let temperature = _this.temperature,
          infoList = _this.infoList;
          temperature.length = 0;
          infoList.length = 0;
          infoList.push({
            key: '最后更新',
            value: data[i].datapoints[0].at.split('.')[0],
            sequence: 0
          });
          for (let key in data[i].datapoints[0].value) {
            let value = data[i].datapoints[0].value[key];
            switch (key) {
              case 'cntl_x':
                let ctrlMsg = parseCtrlMsg(value);
                ctrlMsg = ctrlMsg.length > 0 ? ctrlMsg.join(',') : "无";
                infoList.push({
                  key: '控制信息',
                  //value: value.toString(16).toUpperCase(),
                  value: `${value.toString(16).toUpperCase()} ${ctrlMsg}`,
                  sequence: 1
                });
                break;
              case 'warn_x':
                let warnMsg = parseWarningMsg(value);
                warnMsg = warnMsg.length > 0 ? warnMsg.join(',') : "无";
                infoList.push({
                  key: '告警信息',
                  value: `${value.toString(16).toUpperCase()} ${warnMsg}`,
                  sequence: 2
                });
                break;
              case 'Ah_left':
                infoList.push({
                  key: '剩余电量',
                  value: value + ' AH',
                  sequence: 3
                });
                break;
              case 'percent_left':
                infoList.push({
                  key: '剩余电量',
                  value: value + '%',
                  sequence: 4
                });
                break;
              case 'T_max':
                infoList.push({
                  key: '最高温度',
                  value: value,
                  sequence: 5
                });
                break;
              case 'T1':
                temperature.push({
                  value: value,
                  sequence: 1
                });
                break;
              case 'T2':
                temperature.push({
                  value: value,
                  sequence: 2
                });
                break;
              case 'T3':
                temperature.push({
                  value: value,
                  sequence: 3
                });
                break;
              case 'T4':
                temperature.push({
                  value: value,
                  sequence: 4
                });
                break;
              case 'T5':
                temperature.push({
                  value: value,
                  sequence: 5
                });
                break;
              case 'Power':
                infoList.push({
                  key: '输出功率',
                  value: value,
                  sequence: 7
                });
                break;
              case 'V_total':
                infoList.push({
                  key: '总电压值',
                  value: value,
                  sequence: 8
                });
                break;
              case 'I_total':
                infoList.push({
                  key: '总电流值',
                  value: value,
                  sequence: 9
                });
                break;
              case 'I_charge':
                infoList.push({
                  key: '充电电流',
                  value: value,
                  sequence: 10
                });
                break;
              case 'I_discharge':
                infoList.push({
                  key: '放电电流',
                  value: value,
                  sequence: 11
                });
                break;
              case 'days_left':
                infoList.push({
                  key:'剩余天数',
                  value: value,
                  sequence: 12
                })
                break;
              case 'V':
                let singleBatteryInfo = _this.singleBatteryInfo;
                singleBatteryInfo.length = 0;
                for (let j = 0; j < value.length; j++) {
                  value[j] = value[j] / 10000;
                  singleBatteryInfo.push(value[j].toFixed(2));
                }
                break;
            }
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
          infoList.sort(sortArrList('sequence'));
        }

        //填充配置参数
        if (data[i].id == 'parm_info') {
          let resultValue = data[i].datapoints[0].value.parm;
          _this.batteryConfigValue.length = 0;
          _this.batteryConfigValue = parseParamInfo(resultValue).batteryConfigValue;
          console.log('parseInfoInternet,batteryConfig:', _this.batteryConfigValue);
        }

        //填充地图
        if (data[i].id == 'gps_info') {
          let GPSInfoList = _this.GPSInfoList;
          GPSInfoList.length = 0;
          for (let key in data[i].datapoints[0].value) {
            let value = data[i].datapoints[0].value[key];
            //console.log(key, value);
            switch (key) {
              case 'tim':
                GPSInfoList.push({
                  key: '最新时间',
                  value: value,
                  sequence: 0
                });
                break;
              case 'lon':
                GPSInfoList.push({
                  key: '最新经度',
                  value: value,
                  sequence: 1
                });
                break;
              case 'lat':
                GPSInfoList.push({
                  key: '最新纬度',
                  value: value,
                  sequence: 2
                });
                break;
            }
          }
          GPSInfoList.sort(sortArrList('sequence'));
          _this.lat = data[i].datapoints[0].value.lat,
          _this.lon = data[i].datapoints[0].value.lon;
        }

        //填充速度
        if (data[i].id == 'speed') {
          let batterySpeed = _this.batterySpeed,
          value = data[i].datapoints[0].value;
          batterySpeed.length = 0;
          batterySpeed.push({
            key: '最新速度',
            value: value,
            sequence: 0
          });
        }
      }
    },

    publicMethod2: function () {
    }
  };
})();

export { DataManager};