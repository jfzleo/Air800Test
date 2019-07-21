const BleGattAttributes = {
  HEART_RATE_MEASUREMENT : "00002a37-0000-1000-8000-00805f9b34fb",
  CLIENT_CHARACTERISTIC_CONFIG : "00002902-0000-1000-8000-00805f9b34fb",
  BLE_SCI_SERVICE_UUID : "0000ffe0-0000-1000-8000-00805f9b34fb",
  BLE_SCI_CHARACTERISTIC_UUID_TX : "0000ffe1-0000-1000-8000-00805f9b34fb",
  BLE_SCI_CHARACTERISTIC_UUID_FUNCTION : "0000ffe2-0000-1000-8000-00805f9b34fb"
}

var BleProxyJDY = (function() {
   var instance;
   const BLE_SEND_DELAY = 50;
  function writeToBLE(deviceId, serviceId, characUUID, data, successCb) {
    let length = data.length;
    let dataLen20 = (length / 20) >> 0;
    let dataLen0 = length % 20;
    let sendCount = 0;
    if (dataLen20 > 0) {
      for (let i = 0; i < dataLen20; i++) {
        let dat = data.slice(20 * i, 20 * (i + 1));
        setTimeout(() => {
          wx.writeBLECharacteristicValue({
            deviceId: deviceId,
            serviceId: serviceId,
            characteristicId: characUUID,
            value: dat.buffer,
            success: function (res) {
              if (successCb) successCb(res);
            },
          })
          sendCount += 20;
          //console.log(`writeBLE:${new Date().getSeconds()}:${new Date().getMilliseconds()}`, dat);
        }, 23 * i);
      }
    }
    if (dataLen0 > 0) {
      let dat = data.slice(20 * dataLen20, length)
      setTimeout(() => {
        wx.writeBLECharacteristicValue({
          deviceId: deviceId,
          serviceId: serviceId,
          characteristicId: characUUID,
          value: dat.buffer,
          success: function (res) {
            if (successCb) successCb(res);
          },
        })
        sendCount += dataLen0;
        //console.log(`writeBLE:${new Date().getSeconds()}:${new Date().getMilliseconds()}`, dat);
      }, 23 * dataLen20);
    }

    return sendCount
  }
  function getBLEDeviceCharacteristics(deviceId, serviceId) {
    wx.getBLEDeviceCharacteristics({
      deviceId,
      serviceId,
      success: (res) => {
        console.log('getBLEDeviceCharacteristics success', res);
        for (let i = 0; i < res.characteristics.length; i++) {
          const item = res.characteristics[i];
          if (item.uuid.toUpperCase() == BleGattAttributes.BLE_SCI_CHARACTERISTIC_UUID_TX.toUpperCase()) {
            wx.showToast({ title: '获取服务成功' });
            if (item.properties.notify || item.properties.indicate) {
              setTimeout(() => {
                wx.notifyBLECharacteristicValueChange({
                  deviceId,
                  serviceId,
                  characteristicId: item.uuid,
                  state: true,
                  success: () => {
                    console.log(`notify:${item.uuid} success`);
                  },
                  fail: () => {
                    console.error(`notify:${item.uuid} failed`);
                  }
                })
              }, BLE_SEND_DELAY);
            }
            return;
          }
          wx.showToast({ title: '获取服务失败' });
        }
      },
      fail(res) {
        console.error('getBLEDeviceCharacteristics', res)
      }
    });
  }
   function init() {
     return {
       getBLEDeviceServices(deviceId, successCb) {
         wx.getBLEDeviceServices({
           deviceId,
           success: (res) => {
             console.log(`getBLEDeviceServices:`, res);
             for (let i = 0; i < res.services.length; i++) {
               if (res.services[i].uuid.toUpperCase() == BleGattAttributes.BLE_SCI_SERVICE_UUID.toUpperCase()) {
                 setTimeout(()=> {
                   getBLEDeviceCharacteristics(deviceId, res.services[i].uuid);
                 }, BLE_SEND_DELAY);
                 return
               }
             }
           }
         })
       },
       /**************** 定义蓝牙API******************/
        sendData(deviceId, data) {
          return writeToBLE(deviceId, BleGattAttributes.BLE_SCI_SERVICE_UUID.toUpperCase(),
          BleGattAttributes.BLE_SCI_CHARACTERISTIC_UUID_TX.toUpperCase(), data);
        },
        sendCmd(deviceId, cmd) {
          return writeToBLE(deviceId, BleGattAttributes.BLE_SCI_SERVICE_UUID.toUpperCase(), 
          BleGattAttributes.BLE_SCI_CHARACTERISTIC_UUID_FUNCTION.toUpperCase(), cmd);
        },          
       /**************** 定义蓝牙API******************/
     }
   }

  return {
    // Get the Singleton instance if one exists
    // or create one if it doesn't
    getInstance: function () {
      if (!instance) {
        instance = init();
      }
      return instance;
    }
  }; 
})()

export {BleGattAttributes, BleProxyJDY}
