const orderService = require('../../services/order.service')
const { ORDER_STATUS } = require('../../config/status')
const { hideLoading, showError, showLoading, showSuccess } = require('../../utils/toast')

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  { value: ORDER_STATUS.PENDING_PAY, label: '待付款' },
  { value: ORDER_STATUS.PENDING_ACCEPT, label: '待接单' },
  { value: ORDER_STATUS.ACCEPTED, label: '已接单' },
  { value: ORDER_STATUS.SERVING, label: '服务中' },
  { value: ORDER_STATUS.PENDING_REVIEW, label: '待评价' },
  { value: ORDER_STATUS.COMPLETED, label: '已完成' },
  { value: ORDER_STATUS.CANCELED, label: '已取消' }
]

Page({
  data: {
    title: '订单中心',
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
    this.setActiveTabBar()
    this.loadOrders(true)
  },

  setActiveTabBar() {
    if (typeof this.getTabBar === 'function' && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 1
      })
    }
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

  onStatusTap(event) {
    const index = Number(event.currentTarget.dataset.index || 0)
    if (index === this.data.selectedStatusIndex) {
      return
    }

    this.setData({
      selectedStatusIndex: index
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

  handleOrderAction(event) {
    const detail = event.detail || {}
    const action = detail.action
    const order = detail.order || {}

    if (action === 'pay') {
      this.handleMockPay(order)
      return
    }

    if (action === 'cancel') {
      this.handleCancelOrder(order)
      return
    }

    if (action === 'review') {
      wx.navigateTo({
        url: `/pages/review/review?orderId=${order._id}`
      })
      return
    }

    this.goOrderDetail({ detail: order })
  },

  async handleMockPay(order) {
    if (!order || !order._id) {
      showError('缺少订单 ID')
      return
    }

    showLoading('支付中')
    try {
      await orderService.mockPayOrder({
        orderId: order._id
      })
      showSuccess('模拟支付成功')
      this.loadOrders(true)
    } catch (error) {
      showError(error.message || '支付失败')
    } finally {
      hideLoading()
    }
  },

  handleCancelOrder(order) {
    if (!order || !order._id) {
      showError('缺少订单 ID')
      return
    }

    wx.showModal({
      title: '取消订单',
      content: '确认取消这个订单吗？',
      confirmColor: '#16A34A',
      success: async (res) => {
        if (!res.confirm) return
        showLoading('取消中')
        try {
          await orderService.cancelOrder({
            orderId: order._id
          })
          showSuccess('订单已取消')
          this.loadOrders(true)
        } catch (error) {
          showError(error.message || '取消失败')
        } finally {
          hideLoading()
        }
      }
    })
  },

  goHome() {
    wx.switchTab({
      url: '/pages/index/index'
    })
  }
})
