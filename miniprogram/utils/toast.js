function showToast(title, icon = 'none') {
  if (typeof wx === 'undefined') return
  wx.showToast({
    title,
    icon
  })
}

function showSuccess(title = '操作成功') {
  showToast(title, 'success')
}

function showError(title = '操作失败') {
  showToast(title, 'none')
}

function showLoading(title = '加载中') {
  if (typeof wx === 'undefined') return
  wx.showLoading({
    title,
    mask: true
  })
}

function hideLoading() {
  if (typeof wx === 'undefined') return
  wx.hideLoading()
}

module.exports = {
  showToast,
  showSuccess,
  showError,
  showLoading,
  hideLoading
}
