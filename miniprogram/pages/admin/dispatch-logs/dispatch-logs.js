const dispatchService = require('../../../services/dispatch.service')
const { showError } = require('../../../utils/toast')

Page({
  data: {
    title: '派单日志',
    orderId: '',
    logs: [],
    loading: true
  },

  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || '' })
    this.loadLogs()
  },

  async loadLogs() {
    this.setData({ loading: true })
    try {
      const data = await dispatchService.getDispatchLogs({
        orderId: this.data.orderId
      })
      this.setData({ logs: data.logs || [] })
    } catch (error) {
      showError(error.message || '派单日志加载失败')
    } finally {
      this.setData({ loading: false })
    }
  }
})
