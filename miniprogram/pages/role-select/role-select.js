const userService = require('../../services/user.service')
const { USER_ROLE } = require('../../config/roles')
const {
  getCurrentUser,
  getCurrentUserRoleText,
  setCurrentIdentityRole,
  setCurrentUser
} = require('../../utils/auth')
const { hideLoading, showError, showLoading, showSuccess, showToast } = require('../../utils/toast')

Page({
  data: {
    title: '选择登录身份',
    currentUser: null,
    displayName: '未登录',
    roleText: '未登录'
  },

  onShow() {
    this.refreshCurrentUser()
  },

  refreshCurrentUser() {
    const user = getCurrentUser()
    this.setData({
      currentUser: user,
      displayName: user ? user.nickname || '社区用户' : '未登录',
      roleText: user ? getCurrentUserRoleText() : '未登录'
    })
  },

  requireLogin() {
    if (this.data.currentUser) return true

    showError('请先登录')
    wx.switchTab({
      url: '/pages/profile/profile'
    })
    return false
  },

  enterUserRole() {
    if (!this.requireLogin()) return

    const user = setCurrentIdentityRole(USER_ROLE.USER)
    if (user) {
      getApp().globalData.currentUser = user
      this.setData({
        currentUser: user,
        roleText: getCurrentUserRoleText()
      })
    }
    wx.switchTab({
      url: '/pages/index/index'
    })
  },

  enterWorkerRole() {
    if (!this.requireLogin()) return

    const user = setCurrentIdentityRole(USER_ROLE.WORKER)
    if (user) {
      getApp().globalData.currentUser = user
      this.setData({
        currentUser: user,
        roleText: getCurrentUserRoleText()
      })
    }
    wx.navigateTo({
      url:
        this.data.currentUser.role === USER_ROLE.WORKER
          ? '/pages/worker/order-hall/order-hall'
          : '/pages/worker/audit-status/audit-status'
    })
  },

  enterMerchantRole() {
    if (!this.requireLogin()) return

    const user = setCurrentIdentityRole(USER_ROLE.WORKER)
    if (user) {
      getApp().globalData.currentUser = user
      this.setData({
        currentUser: user,
        roleText: getCurrentUserRoleText()
      })
    }
    wx.navigateTo({
      url: '/pages/merchant/audit-status/audit-status'
    })
  },

  enterAdminRole() {
    if (!this.requireLogin()) return

    if (this.data.currentUser.role === USER_ROLE.ADMIN) {
      const user = setCurrentIdentityRole(USER_ROLE.ADMIN)
      if (user) {
        getApp().globalData.currentUser = user
        this.setData({
          currentUser: user,
          roleText: getCurrentUserRoleText()
        })
      }
      wx.navigateTo({
        url: '/pages/admin/dashboard/dashboard'
      })
      return
    }

    wx.showModal({
      title: '管理员身份',
      content: '当前账号还不是管理员。如果系统尚未初始化管理员，可以尝试成为首个管理员。',
      confirmText: '初始化',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          await this.claimInitialAdmin()
        }
      }
    })
  },

  async claimInitialAdmin() {
    showLoading('初始化中')
    try {
      const data = await userService.claimInitialAdmin()
      const user = {
        ...data.user,
        active_role: USER_ROLE.ADMIN
      }
      setCurrentUser(user)
      getApp().globalData.currentUser = user
      this.setData({
        currentUser: user,
        displayName: user.nickname || '社区用户',
        roleText: getCurrentUserRoleText(user.active_role)
      })
      showSuccess('已成为管理员')
      wx.navigateTo({
        url: '/pages/admin/dashboard/dashboard'
      })
    } catch (error) {
      showError(error.message || '初始化失败')
    } finally {
      hideLoading()
    }
  },

  enterCommunityPartnerRole() {
    showToast('小区合伙人端即将开放')
  },

  enterCityPartnerRole() {
    showToast('城市合伙人端即将开放')
  }
})
