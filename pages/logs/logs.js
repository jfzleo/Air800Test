//logs.js
const util = require('../../utils/util.js')

Page({
  data: {
    logs: []
  },
  onLoad: function () {
    this.setData({
      logs: (wx.getStorageSync('logs') || []).map(log => {
        return util.formatTime(new Date(log))
      })
    })
  },
  onShow() {
    console.log("logs onShow()");
  },
  onTabItemTap(item) {
    console.log("logs tab:" + item.pagePath);
  }
})
