const orderService = require('../../services/order.service')
const { ORDER_STATUS, ORDER_STATUS_TEXT } = require('../../config/status')
const { showError } = require('../../utils/toast')

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  ...Object.values(ORDER_STATUS).map((status) => ({
    value: status,
    label: ORDER_STATUS_TEXT[status] || status
  }))
]

Page({
  data: {
    title: '我的订单',
    orders: [],
    statusOptions: STATUS_OPTIONS,
    statusLabels: STATUS_OPTIONS.map((item) => item.label),
    selectedStatusIndex: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
    loading: true
  },

  onShow() {
    this.loadOrders(true)
  },

  onPullDownRefresh() {
    this.loadOrders(true).finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadOrders(false)
    }
  },

  onStatusChange(event) {
    this.setData({
      selectedStatusIndex: Number(event.detail.value || 0)
    })
    this.loadOrders(true)
  },

  async loadOrders(reset = true) {
    const page = reset ? 1 : this.data.page + 1
    const status = STATUS_OPTIONS[this.data.selectedStatusIndex].value
    this.setData({ loading: true })
    try {
      const data = await orderService.getUserOrderList({
        status,
        page,
        pageSize: this.data.pageSize
      })
      const list = data.list || data.orders || []
      this.setData({
        orders: reset ? list : this.data.orders.concat(list),
        page: data.page || page,
        hasMore: !!data.hasMore
      })
    } catch (error) {
      showError(error.message || '订单加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goOrderDetail(event) {
    const order = event.detail || {}
    wx.navigateTo({
      url: `/pages/order-detail/order-detail?orderId=${order._id}`
    })
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
