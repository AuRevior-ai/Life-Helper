Page({
  data: {
    title: '师傅中心'
  },

  goMessageList() {
    wx.navigateTo({
      url: '/pages/message-list/message-list'
    })
  }
})
