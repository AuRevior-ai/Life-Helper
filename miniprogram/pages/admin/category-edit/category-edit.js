Page({
  data: {
    title: '编辑分类'
  },

  goBack() {
    wx.navigateBack({
      delta: 1,
      fail: () => {
        wx.navigateTo({
          url: '/pages/admin/category-list/category-list'
        })
      }
    })
  }
})
