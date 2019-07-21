// pages/batteryGPS.js
const http = require('../data/http.js');
import {gps84_To_Gcj02} from '../../utils/gpsUtils.js';
import util from '../../utils/util.js'

const app = getApp();
Page({
    data: {
        deviceNumber: '',
        searchSuccess: false,
        startDate: '',
        startTime: '',
        endDate: '',
        endTime: '',
        polyline: [],//绘制线
        markers: []//绘制点
    },

    //设置开始日期
    startDate(e) {
        console.log('picker发送选择改变，携带值为', e.detail.value);
        this.setData({
            startDate: e.detail.value
        })
    },

    //设置开始时间
    startTime(e) {
        console.log('picker发送选择改变，携带值为', e.detail.value);
        this.setData({
            startTime: e.detail.value
        })
    },

    //设置结束日期
    endDate(e) {
        console.log('picker发送选择改变，携带值为', e.detail.value);
        this.setData({
            endDate: e.detail.value
        })
    },

    //设置结束时间
    endTime(e) {
        console.log('picker发送选择改变，携带值为', e.detail.value);
        this.setData({
            endTime: e.detail.value
        })
    },

    getDevicePositionHistory: function () {
        let _this = this;
        if (!_this.data.startDate || !_this.data.startTime || !_this.data.endDate || !_this.data.endTime) {
            wx.showToast({
                title: '请输入正确的参数',
                icon: 'none',
                duration: 2000
            });
            return;
        }
        http.getGPSDataPoint(_this.data.deviceNumber,
            _this.data.startDate + 'T' + _this.data.startTime + ':00',
            _this.data.endDate + 'T' + _this.data.endTime + ':59',
            (result) => {
                if (result.data.errno === 0) {
                    if (result.data.data.count === 0) {
                        wx.showToast({
                            title: '当前时间暂时没有轨迹，请稍后再试',
                            icon: 'none',
                            duration: 3000
                        });
                    }
                    let points = result.data.data.datastreams[0].datapoints,
                        mapPoints = [];
                    for (let i = 0; i < points.length; i++) {
                        // console.log(points[i]);
                        mapPoints.push({
                            longitude: points[i].value.lon,
                            latitude: points[i].value.lat
                        });
                    }
                    console.log(mapPoints);
                    mapPoints = mapPoints.map((value, index, array) => {
                        let [lat, lon] = gps84_To_Gcj02(parseFloat(value.latitude), parseFloat(value.longitude));
                        return {latitude: lat, longitude: lon}
                    });
                    console.log(mapPoints);
                    _this.setData({
                        searchSuccess: true,
                        polyline: [{
                            points: mapPoints,
                            color: '#FF0000DD',
                            width: 2,
                            dottedLine: true
                        }],
                        markers: mapPoints
                    });
                    wx.createMapContext('devicePositionHistory').includePoints({
                        points: mapPoints,
                        padding: [30]
                    });
                } else {
                    wx.showToast({
                        title: '请检查查询时间是否正确',
                        icon: 'none',
                        duration: 2000
                    });
                }
            });
    },

    /**
     * 生命周期函数--监听页面加载
     */
    onLoad: function (options) {
        console.log(options);
        this.setData(options);
    },

    /**
     * 生命周期函数--监听页面初次渲染完成
     */
    onReady: function () {
        let nowTime = new Date().getTime();//,
            //beforeTime = nowTime - 900000;

        this.setData({
            startDate: util.formatDate(new Date(nowTime)),
            startTime:'00:00', //startTime: util.formatTimeNoSecond(new Date(beforeTime)),
            endDate: util.formatDate(new Date(nowTime)),
            endTime: '23:59',  //endTime: util.formatTimeNoSecond(new Date(nowTime)),
        })
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

    /**
     * 页面相关事件处理函数--监听用户下拉动作
     */
    onPullDownRefresh: function () {

    },

    /**
     * 页面上拉触底事件的处理函数
     */
    onReachBottom: function () {

    },

    /**
     * 用户点击右上角分享
     */
    onShareAppMessage: function () {

    }
});