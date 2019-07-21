const app = getApp();
import {DataManager} from "model";

const onenetDomain = 'https://api.heclouds.com';


//查询设备状态
function getDeviceStatus(deviceNum, successCB, failCB) {
    console.log(`getDeviceStatus:${deviceNum}`);
    wx.request({
        url: `${onenetDomain}/devices/status`,
        method: "GET",
        header: {
            'api-key': app.config.onenetApiKey
        },
        data: {
            devIds: deviceNum
        },
        success: function (result) {
            successCB(result);
        },
        fail: function () {
            failCB();
        }
    });
}

function getDeviceDataPoints(deviceNumber, successCB, failCB) {
    //查询设备信息
    wx.request({
        url: `${onenetDomain}/devices/${deviceNumber}/datapoints`,
        method: "GET",
        header: {
            'api-key': app.config.onenetApiKey
        },
        data: {},
        success: function (result) {
            if (result.data.errno == 0) {
                DataManager.parseInfoInternet(result.data);
            }
            successCB(result);
        },
        fail: function () {
            console.log("getDeviceDataPoints 接口调用失败");
            failCB();
        }
    });
}

function reloadDeviceParameter(deviceNumber, successCb, failCb) {
    wx.request({
        url: `${onenetDomain}/cmds?device_id=${deviceNumber}`,
        method: "POST",
        header: {
            'api-key': app.config.onenetApiKey,
            // 'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8'
        },
        data: 'getparm',
        success: function (result) {
            successCb(result);
        },
        fail: function () {
            failCb();
        }
    });
}

function getGPSDataPoint(deviceNumber, startTime, endTime, successCb, failCb) {
    wx.request({
        url: `${onenetDomain}/devices/${deviceNumber}/datapoints`,
        method: "GET",
        header: {
            'api-key': app.config.onenetApiKey
        },
        data: {
            datastream_id: 'gps_info',
            // start: '2019-01-10T09:00:00',
            // end: '2019-01-11T12:00:00'
            start: startTime,
            end: endTime,
            limit: 6000
        },
        success: function (result) {
            successCb(result);
        },
        fail: function () {
            failCb();
        },
    });
}

export {
    getDeviceStatus, getDeviceDataPoints,
    reloadDeviceParameter, getGPSDataPoint
};