const adminService = require('../../../services/admin.service')
const { ORDER_STATUS, ORDER_STATUS_TEXT } = require('../../../config/status')
const { formatOrderStatus, formatPrice } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

const STATUS_OPTIONS = [
  { value: '', label: '全部' },
  ...Object.values(ORDER_STATUS).map((status) => ({
    value: status,
    label: ORDER_STATUS_TEXT[status] || status
  }))
]

function mapOrder(order) {
  return {
    ...order,
    statusText: formatOrderStatus(order.status),
    priceText: formatPrice(order.price)
  }
}

Page({
  data: {
    title: '订单管理',
    orders: [],
    statusLabels: STATUS_OPTIONS.map((item) => item.label),
    selectedStatusIndex: 0,
    categoryId: '',
    keyword: '',
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

  onCategoryInput(event) {
    this.setData({ categoryId: event.detail.value })
  },

  onKeywordInput(event) {
    this.setData({ keyword: event.detail.value })
  },

  applyFilters() {
    this.loadOrders(true)
  },

  async loadOrders(reset = true) {
    const page = reset ? 1 : this.data.page + 1
    const status = STATUS_OPTIONS[this.data.selectedStatusIndex].value
    this.setData({ loading: true })
    try {
      const data = await adminService.getAllOrders({
        status,
        category_id: this.data.categoryId,
        keyword: this.data.keyword,
        page,
        pageSize: this.data.pageSize
      })
      const list = data.list || data.orders || []
      this.setData({
        orders: reset ? list.map(mapOrder) : this.data.orders.concat(list.map(mapOrder)),
        page: data.page || page,
        hasMore: !!data.hasMore
      })
    } catch (error) {
      showError(error.message || '订单加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  goDetail(event) {
    const orderId = event.currentTarget.dataset.id
    wx.navigateTo({
      url: `/pages/admin/order-detail/order-detail?orderId=${orderId}`
    })
  }
})
