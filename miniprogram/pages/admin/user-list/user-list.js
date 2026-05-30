const adminService = require('../../../services/admin.service')
const { showError, showSuccess } = require('../../../utils/toast')

function mapUser(user) {
  return {
    ...user,
    displayName: user.nick_name || user.nickname || user.openid || '未命名用户',
    roleText: user.role || 'user',
    statusText: user.status === 'disabled' ? '已禁用' : '正常'
  }
}

Page({
  data: {
    title: '用户管理',
    users: [],
    loading: true,
    submittingId: ''
  },

  onShow() {
    this.loadUsers()
  },

  onPullDownRefresh() {
    this.loadUsers().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadUsers() {
    this.setData({ loading: true })
    try {
      const data = await adminService.getAllUsers()
      this.setData({
        users: (data.users || []).map(mapUser)
      })
    } catch (error) {
      showError(error.message || '用户加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  disableUser(event) {
    const userId = event.currentTarget.dataset.id
    wx.showModal({
      title: '禁用用户',
      content: '确认禁用该用户吗？',
      confirmColor: '#b65230',
      success: async (res) => {
        if (!res.confirm) return
        this.setData({ submittingId: userId })
        try {
          await adminService.disableUser({ userId })
          showSuccess('已禁用')
          await this.loadUsers()
        } catch (error) {
          showError(error.message || '禁用失败')
        } finally {
          this.setData({ submittingId: '' })
        }
      }
    })
  }
})
