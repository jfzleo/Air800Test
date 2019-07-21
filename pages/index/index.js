//index.js
//获取应用实例
import { isAdminLogin} from '../data/appsrv.js'
const app = getApp();

Page({
  data: {
    motto: 'Hello World',
    userInfo: {},
    hasUserInfo: false,
    appVersion: null,
    canIUse: wx.canIUse('button.open-type.getUserInfo'),
    clickCount : 0
  },
  //事件处理函数
  bindViewTap: function() {
    wx.navigateTo({
      url: '../logs/logs'
    })
  },
  onLoad: function () {
    if (app.globalData.userInfo) {
      this.setData({
        userInfo: app.globalData.userInfo,
        hasUserInfo: true
      })
    } else if (this.data.canIUse){
      // 由于 getUserInfo 是网络请求，可能会在 Page.onLoad 之后才返回
      // 所以此处加入 callback 以防止这种情况
      app.userInfoReadyCallback = res => {
        this.setData({
          userInfo: res.userInfo,
          hasUserInfo: true
        })
      }
    } else {
      // 在没有 open-type=getUserInfo 版本的兼容处理
      wx.getUserInfo({
        success: res => {
          app.globalData.userInfo = res.userInfo
          this.setData({
            userInfo: res.userInfo,
            hasUserInfo: true
          })
        }
      })
    }
    let _this = this;
    _this.setData({
      appVersion: app.globalData.appVersion
    })
  },
  onShow() {
    let _this = this;
    isAdminLogin((res) => {
      console.log("index, onShow isAdmin:", res)
      _this._isAdmin = res
    });
  },
  getUserInfo: function(e) {
    console.log(e)
    app.globalData.userInfo = e.detail.userInfo
    this.setData({
      userInfo: e.detail.userInfo,
      hasUserInfo: true
    })
  },
  adminModeClick() {
    let _this = this;
    _this.data.clickCount++;
    if (_this._isAdmin) {
      if (_this.data.clickCount > 5) {
        _this.data.clickCount = 0;
        _this._isAdmin = false;
        wx.setStorage({
          key: 'isAdmin',
          data: _this._isAdmin,
        })
        wx.showToast({
          title: '关闭管理者模式',
          icon: 'none'
        })
      }
    } else {
      if (_this.data.clickCount > 5) {
        _this.data.clickCount = 0;
        wx.navigateTo({
          url: '/pages/login/login',
        })
      } 
    }
    
  }
})
