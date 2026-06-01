const financeService = require('../../../services/finance.service')
const {
  FINANCE_LOG_TYPE_TEXT,
  WORKER_EARNING_STATUS_TEXT
} = require('../../../config/status')
const { formatPrice } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

function mapLog(log = {}) {
  return {
    ...log,
    typeText: FINANCE_LOG_TYPE_TEXT[log.type] || log.type,
    amountText: formatPrice(log.amount)
  }
}

function mapEarning(earning = {}) {
  return {
    ...earning,
    statusText: WORKER_EARNING_STATUS_TEXT[earning.status] || earning.status,
    earningText: formatPrice(earning.worker_earning_amount),
    commissionText: formatPrice(earning.platform_commission_amount)
  }
}

Page({
  data: {
    title: '订单财务详情',
    orderId: '',
    order: {},
    logs: [],
    earnings: [],
    loading: true
  },

  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || '' })
    this.loadDetail()
  },

  async loadDetail() {
    if (!this.data.orderId) {
      showError('缺少订单 ID')
      return
    }
    this.setData({ loading: true })
    try {
      const data = await financeService.adminGetOrderFinanceDetail({
        orderId: this.data.orderId
      })
      this.setData({
        order: data.order || {},
        logs: (data.logs || []).map(mapLog),
        earnings: (data.earnings || []).map(mapEarning)
      })
    } catch (error) {
      showError(error.message || '订单财务详情加载失败')
    } finally {
      this.setData({ loading: false })
    }
  }
})

