//app.js
App({
  onLaunch: function () {
    // 展示本地存储能力
    var logs = wx.getStorageSync('logs') || []
    logs.unshift(Date.now())
    wx.setStorageSync('logs', logs)

    // 登录
    wx.login({
      success: res => {
        // 发送 res.code 到后台换取 openId, sessionKey, unionId
      }
    })
    // 获取用户信息
    wx.getSetting({
      success: res => {
        if (res.authSetting['scope.userInfo']) {
          // 已经授权，可以直接调用 getUserInfo 获取头像昵称，不会弹框
          wx.getUserInfo({
            success: res => {
              // 可以将 res 发送给后台解码出 unionId
              this.globalData.userInfo = res.userInfo

              // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
              // 所以此处加入 callback 以防止这种情况
              if (this.userInfoReadyCallback) {
                this.userInfoReadyCallback(res)
              }
            }
          })
        }
      }
    })
  },
  globalData: {
    userInfo: null,
    deviceInfo: null,
    connectMode: 1, // 1:互联网，2：蓝牙
    appVersion: '1.6.17'
    },
  config: {
    //onenetApiKey: 'Kdw60vUEHU=7nhvU3W3=Ud8Xve4='
    //onenetApiKey: 'DYfb5Vot9m1VU1d2LVKNCZtOdzU='
    onenetApiKey: 'C=4l6A3Tgrmt=px2nN6JGPfzPXI='
  }
})