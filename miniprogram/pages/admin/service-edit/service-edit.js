Page({
  data: {
    title: '编辑服务'
  },

  goServiceList() {
    wx.navigateTo({
      url: '/pages/admin/service-list/service-list'
    })
  }
})
