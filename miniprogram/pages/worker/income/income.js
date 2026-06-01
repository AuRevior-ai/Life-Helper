const financeService = require('../../../services/finance.service')
const { WORKER_EARNING_STATUS_TEXT } = require('../../../config/status')
const { formatPrice } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

function mapEarning(earning = {}) {
  return {
    ...earning,
    statusText: WORKER_EARNING_STATUS_TEXT[earning.status] || earning.status,
    workerEarningText: formatPrice(earning.worker_earning_amount),
    commissionText: formatPrice(earning.platform_commission_amount),
    paidAmountText: formatPrice(earning.paid_amount)
  }
}

Page({
  data: {
    title: '收入统计',
    totalCount: 0,
    totalAmountText: '¥0.00',
    frozenAmountText: '¥0.00',
    settleableAmountText: '¥0.00',
    settledAmountText: '¥0.00',
    reversedAmountText: '¥0.00',
    earnings: [],
    loading: true
  },

  onShow() {
    this.loadIncomeStats()
  },

  onPullDownRefresh() {
    this.loadIncomeStats().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadIncomeStats() {
    this.setData({ loading: true })
    try {
      const summary = await financeService.getWorkerIncomeSummary()
      const listData = await financeService.getWorkerEarningList()
      this.setData({
        totalCount: summary.total_count || 0,
        totalAmountText: formatPrice(summary.total_amount || 0),
        frozenAmountText: formatPrice(summary.frozen_amount || 0),
        settleableAmountText: formatPrice(summary.settleable_amount || 0),
        settledAmountText: formatPrice(summary.settled_amount || 0),
        reversedAmountText: formatPrice(summary.reversed_amount || 0),
        earnings: (listData.earnings || []).map(mapEarning)
      })
    } catch (error) {
      showError(error.message || '收入统计加载失败')
    } finally {
      this.setData({ loading: false })
    }
  }
})
