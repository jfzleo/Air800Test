// pages/bms/parameter/parameter.js
Page({

  /**
   * 页面的初始数据
   */
  data: {
    winWidth: 0,
    winHeight: 0,
    currentTab: 0,
    datalists: [
      "习近平主持中央财经领导小组第十五次会议",
      "李克强打叉的“万里审批图”成历史",
      "新疆自治区举行反恐维稳誓师大会",
      "朝鲜代表团抵达马来西亚处理金正男遇害案",
      "宝马车祸案肇事者二次精神鉴定:案发为精神病状态",
      "朝鲜代表团抵达马来西亚处理金正男遇害案",
      "宝马车祸案肇事者二次精神鉴定:案发为精神病状态",
      "朝鲜代表团抵达马来西亚处理金正男遇害案",
      "宝马车祸案肇事者二次精神鉴定:案发为精神病状态",
      "朝鲜代表团抵达马来西亚处理金正男遇害案",
      "宝马车祸案肇事者二次精神鉴定:案发为精神病状态",
      "砸锅卖铁！索尼是在走向毁灭 还是在奔向新生？"
    ],
    reslists: ["hello", "thank you for your read", "if u feel good", "can u give me good？"],
    iconlists: [
      { normal: "../../../image/ic_menu_home_81.png", focus: "../../../image/ic_menu_home_81_p.png" },
      { normal: "../../../image/ic_battery_81.png", focus: "../../../image/ic_battery_81_p.png" },
      { normal: "../../../image/icon_Param.png", focus: "../../../image/icon_Param_HL.png" },
      { normal: "../../../image/icon_component.png", focus: "../../../image/icon_component_HL.png" },
    ]
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    let that = this;
    //获取系统信息
    wx.getSystemInfo({
      success: function (res) {
        that.setData({
          winWidth: res.windowWidth,
          winHeight: res.windowHeight
        });
      }
    });
  },
  /**
       * 滑动切换tab
       */
  bindChange: function (e) {
    var that = this;
    that.setData({ currentTab: e.detail.current });
  },
  /**
   * 点击切换tab
   */
  swichNav: function (e) {
    console.log(e)
    var that = this;
    if (this.data.currentTab === e.currentTarget.dataset.current) {
      //点击的是同一个，则不操作
      return false;
    } else {
      that.setData({
        currentTab: e.currentTarget.dataset.current
      })
    }

  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

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
})