// pages/ble/blescan.js
import {BleProxyJDY} from "../ble/BleDeviceProxy";
import {inArray} from "../../utils/util";
const app = getApp();

Page({
  _discoveryStarted: false,
  /**
   * 页面的初始数据
   */
  data: {
    btn_scan_text: "开始扫描",
    devices: [/*{
      name : "BT05",
      deviceId : "AAAAAAAA",
      RSSI : "-30",
      advertisServiceUUIDs : ['xxxx', 'aaaa']
     },
      {
        name: "BT05",
        deviceId: "AAAAAAAA",
        RSSI: "-30",
        advertisServiceUUIDs: ['xxxx', 'aaaa']
      }*/],
    connected: false,
    chs: [],
    timerBleScan : 0,
  },
  openBluetoothAdapter : function() {
    wx.openBluetoothAdapter({
      success: (res) => {
        console.log('openBluetoothAdapter success', this._discoveryStarted, res)
        if (this._discoveryStarted) {
          this.stopBluetoothDevicesDiscovery()
        } else {
          this.startBluetoothDevicesDiscovery()
        }        
      },
      fail: (res) => {
        if (res.errCode === 10001) {
          wx.showModal({
            title: '错误',
            content: '未找到蓝牙设备, 请打开蓝牙后重试。',
            showCancel: false
          });
          wx.onBluetoothAdapterStateChange(function (res) {
            console.log('onBluetoothAdapterStateChange', res)
            if (res.available) {
              if (this._discoveryStarted) {
                this.stopBluetoothDevicesDiscovery()
              } else {
                this.startBluetoothDevicesDiscovery()
              }  
            }
          });
        }
      }
    })
  },
  startBluetoothDevicesDiscovery :function() {
    if (this._discoveryStarted) {
      return
    }
    wx.startBluetoothDevicesDiscovery({
      allowDuplicatesKey: true,
      success: (res) => {
        this._discoveryStarted = true
        this.setData({btn_scan_text : "停止扫描"})
        console.log('startBluetoothDevicesDiscovery success', res)
        this.onBluetoothDeviceFound()
      },
    })
  },
  stopBluetoothDevicesDiscovery() {
    wx.stopBluetoothDevicesDiscovery({
      complete: () => {
        console.log("stopBluetoothDevicesDiscovery complete")
        this._discoveryStarted = false
        this.setData({btn_scan_text : "开始扫描"})
      }
    })
  },
  onBluetoothDeviceFound : function() {
    wx.onBluetoothDeviceFound((res) => {
      res.devices.forEach(device => {
        if (!device.name && !device.deviceId) {
          return
        }
        const foundDevices = this.data.devices
        const idx = inArray(foundDevices, 'deviceId', device.deviceId)
        const data = {}
        if (idx === -1) {
          data[`devices[${foundDevices.length}]`] = device
        } else {
          data[`devices[${idx}]`] = device
        }
        this.setData(data)
      })
    })
  },
  gotoBleConnection(data) {
    this.stopBluetoothDevicesDiscovery();
    const ds = data.currentTarget.dataset;
    const deviceId = ds.deviceId;
    const name = ds.name;
    app.globalData.connectMode = 2;
    wx.redirectTo({
      url: `../bms/home/home?name=${name}&deviceId=${deviceId}&connectMode=2`,
      success: function(res) {},
      fail: function(res) {},
      complete: function(res) {},
    });
  },
  writeBLECharacteristicValue() {
    // 向蓝牙设备发送一个0x00的16进制数据
    const buffer = new ArrayBuffer(1)
    const dataView = new DataView(buffer)
    // eslint-disable-next-line
    dataView.setUint8(0, Math.random() * 255 | 0)
    wx.writeBLECharacteristicValue({
      deviceId: this._deviceId,
      serviceId: this._deviceId,
      characteristicId: this._characteristicId,
      value: buffer,
    })
  },
  closeBluetoothAdapter() {
    wx.closeBluetoothAdapter()
    this._discoveryStarted = false
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {
    this.stopBluetoothDevicesDiscovery();
  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  }
})