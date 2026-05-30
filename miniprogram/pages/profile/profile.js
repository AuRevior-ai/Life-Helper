const loginService = require('../../services/login.service')
const userService = require('../../services/user.service')
const { USER_ROLE } = require('../../config/roles')
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
    statusText: '未登录',
    roleTone: 'guest',
    roleHomeTitle: '居民中心',
    roleHomeDesc: '登录后可预约服务、管理地址并查看订单进度',
    primaryActionText: '查看订单',
    secondaryActionText: '完善资料',
    isWorker: false,
    isAdmin: false
  },

  onShow() {
    this.refreshCurrentUser()
  },

  refreshCurrentUser() {
    this.applyCurrentUser(getCurrentUser())
  },

  applyCurrentUser(user) {
    const isLoggedIn = Boolean(user)
    const roleProfile = this.getRoleProfile(user)
    this.setData({
      currentUser: user,
      isLoggedIn,
      avatarText: isLoggedIn ? (user.nickname || '社区用户').slice(0, 1) : '未',
      displayName: isLoggedIn ? user.nickname || '社区用户' : '未登录',
      displayPhone: isLoggedIn ? user.phone || '手机号待填写' : '登录后完善手机号',
      roleText: isLoggedIn ? getCurrentUserRoleText(user.role) : '未登录',
      statusText: isLoggedIn ? this.getStatusText(user.status) : '未登录',
      ...roleProfile,
      isWorker: Boolean(user && user.role === USER_ROLE.WORKER),
      isAdmin: Boolean(user && user.role === USER_ROLE.ADMIN)
    })
  },

  getRoleProfile(user) {
    if (user && user.role === USER_ROLE.ADMIN) {
      return {
        roleTone: 'admin',
        roleHomeTitle: '管理工作台',
        roleHomeDesc: '处理师傅审核、订单状态、用户状态和服务上下架',
        primaryActionText: '进入管理端',
        secondaryActionText: '完善资料'
      }
    }

    if (user && user.role === USER_ROLE.WORKER) {
      return {
        roleTone: 'worker',
        roleHomeTitle: '师傅工作台',
        roleHomeDesc: '查看待接订单、处理服务进度并统计已完成收入',
        primaryActionText: '进入接单大厅',
        secondaryActionText: '查看师傅订单'
      }
    }

    return {
      roleTone: 'user',
      roleHomeTitle: '居民中心',
      roleHomeDesc: '预约保洁、维修、宠物照看等服务，并跟踪订单进度',
      primaryActionText: '查看订单',
      secondaryActionText: '完善资料'
    }
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

  goRolePrimaryAction() {
    if (this.data.isAdmin) {
      this.goAdminEntry()
      return
    }

    if (this.data.isWorker) {
      wx.navigateTo({
        url: '/pages/worker/order-hall/order-hall'
      })
      return
    }

    this.goOrderList()
  },

  goRoleSecondaryAction() {
    if (this.data.isWorker) {
      wx.navigateTo({
        url: '/pages/worker/order-list/order-list'
      })
      return
    }

    this.goProfileEdit()
  },

  goWorkerEntry() {
    wx.navigateTo({
      url: this.data.isWorker ? '/pages/worker/order-hall/order-hall' : '/pages/worker/audit-status/audit-status'
    })
  },

  goAdminEntry() {
    wx.navigateTo({
      url: '/pages/admin/dashboard/dashboard'
    })
  },

  async claimInitialAdmin() {
    showLoading('初始化中')
    try {
      const data = await userService.claimInitialAdmin()
      setCurrentUser(data.user)
      getApp().globalData.currentUser = data.user
      this.applyCurrentUser(data.user)
      showSuccess('已成为管理员')
    } catch (error) {
      showError(error.message || '初始化失败')
    } finally {
      hideLoading()
    }
  }
})
