const adminService = require('../../../services/admin.service')
const { formatPrice } = require('../../../utils/format')
const { showError } = require('../../../utils/toast')

const ENTRY_GROUPS = Object.freeze([
  {
    key: 'orders',
    title: '订单履约',
    description: '订单、售后、派单与服务区域',
    expanded: false,
    entries: [
      { label: '订单管理', url: '/pages/admin/order-list/order-list' },
      { label: '售后管理', url: '/pages/admin/after-sale-list/after-sale-list' },
      { label: '区域管理', url: '/pages/admin/area-list/area-list' },
      { label: '派单日志', url: '/pages/admin/dispatch-logs/dispatch-logs' }
    ]
  },
  {
    key: 'supply',
    title: '供给配置',
    description: '师傅审核、服务与分类',
    expanded: false,
    entries: [
      { label: '师傅审核', url: '/pages/admin/worker-audit/worker-audit' },
      { label: '服务管理', url: '/pages/admin/service-list/service-list' },
      { label: '分类管理', url: '/pages/admin/category-list/category-list' }
    ]
  },
  {
    key: 'merchant',
    title: '商家准入',
    description: '商家、资质、保证金和入驻风控',
    expanded: false,
    entries: [
      { label: '商家管理', url: '/pages/admin/merchant-list/merchant-list' },
      { label: '资质审核', url: '/pages/admin/qualification-review/qualification-review' },
      { label: '保证金审核', url: '/pages/admin/deposit-review/deposit-review' },
      { label: '入驻风控', url: '/pages/admin/risk-control/risk-control' }
    ]
  },
  {
    key: 'finance',
    title: '财务营销',
    description: '流水、收益、会员、优惠券和打赏',
    expanded: false,
    entries: [
      { label: '财务流水', url: '/pages/admin/finance-log-list/finance-log-list' },
      { label: '师傅收益', url: '/pages/admin/worker-earning-list/worker-earning-list' },
      { label: '会员方案', url: '/pages/admin/member-plan-list/member-plan-list' },
      { label: '优惠券管理', url: '/pages/admin/coupon-template-list/coupon-template-list' },
      { label: '打赏记录', url: '/pages/admin/tip-log-list/tip-log-list' }
    ]
  },
  {
    key: 'content',
    title: '内容用户',
    description: '用户、评价与差评申诉',
    expanded: false,
    entries: [
      { label: '用户管理', url: '/pages/admin/user-list/user-list' },
      { label: '评价管理', url: '/pages/admin/review-list/review-list' },
      { label: '差评申诉', url: '/pages/admin/review-appeal-list/review-appeal-list' }
    ]
  }
])

Page({
  data: {
    title: '管理首页',
    loading: true,
    stats: {
      user_count: 0,
      order_count: 0,
      pending_worker_count: 0,
      completed_order_amount: 0
    },
    completedOrderAmountText: formatPrice(0),
    entryGroups: ENTRY_GROUPS.map((group) => ({ ...group, entries: group.entries.map((entry) => ({ ...entry })) }))
  },

  onShow() {
    this.loadDashboard()
  },

  onPullDownRefresh() {
    this.loadDashboard().finally(() => {
      wx.stopPullDownRefresh()
    })
  },

  async loadDashboard() {
    this.setData({ loading: true })
    try {
      const data = await adminService.getDashboard()
      const stats = data.stats || {}
      this.setData({
        stats,
        completedOrderAmountText: formatPrice(stats.completed_order_amount)
      })
    } catch (error) {
      showError(error.message || '看板加载失败')
    } finally {
      this.setData({ loading: false })
    }
  },

  toggleEntryGroup(event) {
    const index = Number(event.currentTarget.dataset.index)
    const group = this.data.entryGroups[index]
    if (!group) return
    this.setData({
      [`entryGroups[${index}].expanded`]: !group.expanded
    })
  },

  goEntry(event) {
    const url = event.currentTarget.dataset.url
    if (!url) return
    wx.navigateTo({ url })
  }
})
