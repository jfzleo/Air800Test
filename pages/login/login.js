// pages/login/login.js
const appsrv = require('../data/appsrv.js');

Page({

  /**
   * 页面的初始数据
   */
  data: {
    userName: '',
    userPassword: '',
    showPassword : false
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let _this = this;  
    wx.getStorage({key:'userName', success(res) {
      _this.setData({userName: res.data})
    }})
    wx.getStorage({key:'userPassword', success(res) {
      _this.setData({userPassword:res.data})
    }})
  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {
    return {
      title: '用户登陆',
      path: 'pages/login/login'
    }
  }, 

  onCheckChanged(event) {
    let _this = this;
    _this.setData({ showPassword: event != null && event.detail.value.length > 0 });
    //console.log(event);
  },

  formSubmit(event) {
    let loginInfo = event.detail.value;
    console.log(loginInfo);
    if (loginInfo != null && loginInfo.name != "" && loginInfo.password != "") {
      appsrv.userLogin(loginInfo.name, loginInfo.password, (res) => {
        console.log(res);
        if (res.data != null && res.data.code == 0) {
          wx.showToast({
            title: '登陆成功',
            icon: 'none'
          });
          wx.setStorage({
            key: 'userName',
            data: loginInfo.name
          });
          wx.setStorage({
            key: 'userPassword',
            data: loginInfo.password
          });
          wx.setStorage({
            key: 'isAdmin',
            data: new Date().getTime(),
          });
          wx.navigateBack({
            delta: 1
          })
        } else {
          wx.showToast({
            title: '用户名或密码错误',
            icon: 'none'
          });
        }       
      }, (res) => {
        wx.showToast({
          title: '登陆失败',
          icon: 'none'
        });
      }
      );
    } else {
      wx.showToast({
        title: '用户名或密码不能为空',
        icon: 'none'
      })
    }
  }
})