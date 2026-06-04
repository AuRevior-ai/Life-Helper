const adminService = require("../../../services/admin.service");
const { getCurrentUser } = require("../../../utils/auth");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

const entryGroups = Object.freeze([
  {
    title: "商家准入",
    entries: [
      {
        label: "资质审核",
        url: "/pages/admin/qualification-review/qualification-review",
      },
      {
        label: "保证金审核",
        url: "/pages/admin/deposit-review/deposit-review",
      },
      {
        label: "入驻风控",
        url: "/pages/admin/risk-control/risk-control",
      },
    ],
  },
  {
    title: "财务营销",
    entries: [
      {
        label: "财务流水",
        url: "/pages/admin/finance-log-list/finance-log-list",
      },
      {
        label: "优惠券管理",
        url: "/pages/admin/coupon-template-list/coupon-template-list",
      },
      {
        label: "评价管理",
        url: "/pages/admin/review-list/review-list",
      },
    ],
  },
]);

function normalizeStats(stats = {}) {
  return {
    userCount: Number(stats.user_count || stats.userCount || 0),
    orderCount: Number(stats.order_count || stats.orderCount || 0),
    pendingWorkerCount: Number(
      stats.pending_worker_count || stats.pendingWorkerCount || 0,
    ),
    completedAmount: Number(
      stats.completed_order_amount || stats.completedOrderAmount || 0,
    ),
  };
}

Page({
  data: {
    loading: true,
    adminName: "张管理员",
    adminInitial: "管",
    handledText: "今天已处理 0 项待办",
    completedAmountText: formatPrice(0),
    entryGroups,
    stats: normalizeStats(),
  },

  onShow() {
    this.applyCurrentUser();
    this.loadDashboard();
  },

  onPullDownRefresh() {
    this.loadDashboard().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  applyCurrentUser() {
    const user = getCurrentUser();
    const adminName = user && user.nickname ? user.nickname : "张管理员";
    this.setData({
      adminName,
      adminInitial: adminName.slice(0, 1) || "管",
    });
  },

  async loadDashboard() {
    this.setData({ loading: true });
    try {
      const data = await adminService.getDashboard();
      const stats = normalizeStats(data.stats || {});
      this.setData({
        stats,
        handledText: `今天已处理 ${stats.pendingWorkerCount} 项待办`,
        completedAmountText: formatPrice(stats.completedAmount),
      });
    } catch (error) {
      showError(error.message || "看板加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goEntry(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) return;
    wx.navigateTo({ url });
  },

  toggleEntryGroup() {
    return entryGroups;
  },
});
