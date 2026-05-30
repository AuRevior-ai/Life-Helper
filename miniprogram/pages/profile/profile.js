const loginService = require('../../services/login.service')
const {
  clearCurrentUser,
  getCurrentUser,
  getCurrentUserRoleText,
  setCurrentUser
} = require('../../utils/auth')
const { hideLoading, showError, showLoading, showSuccess } = require('../../utils/toast')

Page({
  data: {
    title: '我的',
    currentUser: null,
    isLoggedIn: false,
    avatarText: '未',
    displayName: '未登录',
    displayPhone: '手机号待填写',
    roleText: '未登录',
    statusText: '未登录'
  },

  onShow() {
    this.refreshCurrentUser()
  },

  refreshCurrentUser() {
    this.applyCurrentUser(getCurrentUser())
  },

  applyCurrentUser(user) {
    const isLoggedIn = Boolean(user)
    this.setData({
      currentUser: user,
      isLoggedIn,
      avatarText: isLoggedIn ? (user.nickname || '社区用户').slice(0, 1) : '未',
      displayName: isLoggedIn ? user.nickname || '社区用户' : '未登录',
      displayPhone: isLoggedIn ? user.phone || '手机号待填写' : '登录后完善手机号',
      roleText: isLoggedIn ? getCurrentUserRoleText(user.role) : '未登录',
      statusText: isLoggedIn ? this.getStatusText(user.status) : '未登录'
    })
  },

  getStatusText(status) {
    if (status === 'normal') return '正常'
    if (status === 'disabled') return '已禁用'
    return '未知'
  },

  getAuthorizedProfile() {
    if (typeof wx === 'undefined' || !wx.getUserProfile) {
      return Promise.resolve({})
    }

    return new Promise((resolve, reject) => {
      wx.getUserProfile({
        desc: '用于完善会员资料',
        lang: 'zh_CN',
        success: (res) => {
          const userInfo = res.userInfo || {}
          resolve({
            nickname: userInfo.nickName || '社区用户',
            avatar: userInfo.avatarUrl || ''
          })
        },
        fail: () => {
          reject(new Error('已取消授权'))
        }
      })
    })
  },

  async handleLogin() {
    let profile = {}
    try {
      profile = await this.getAuthorizedProfile()
    } catch (error) {
      showError(error.message || '已取消授权')
      return
    }

    showLoading('登录中')
    try {
      const data = await loginService.loginOrRegister({ profile })
      const user = data.user
      setCurrentUser(user)
      getApp().globalData.currentUser = user
      this.applyCurrentUser(user)
      showSuccess(data.isNewUser ? '登录成功' : '欢迎回来')
      this.goRoleSelect()
    } catch (error) {
      showError(error.message || '登录失败')
    } finally {
      hideLoading()
    }
  },

  handleLogout() {
    clearCurrentUser()
    getApp().globalData.currentUser = null
    this.applyCurrentUser(null)
    showSuccess('已退出')
  },

  goOrderList() {
    wx.switchTab({
      url: '/pages/order-list/order-list'
    })
  },

  goAddressList() {
    wx.navigateTo({
      url: '/pages/address-list/address-list'
    })
  },

  goProfileEdit() {
    wx.navigateTo({
      url: '/pages/profile-edit/profile-edit'
    })
  },

  goRoleSelect() {
    wx.navigateTo({
      url: '/pages/role-select/role-select'
    })
  },

  goMessageList() {
    wx.navigateTo({
      url: '/pages/message-list/message-list'
    })
  }
})
