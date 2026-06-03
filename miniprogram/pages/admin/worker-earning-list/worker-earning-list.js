const financeService = require("../../../services/finance.service");
const { WORKER_EARNING_STATUS_TEXT } = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

function mapEarning(earning = {}) {
  return {
    ...earning,
    statusText: WORKER_EARNING_STATUS_TEXT[earning.status] || earning.status,
    earningText: formatPrice(earning.worker_earning_amount),
    commissionText: formatPrice(earning.platform_commission_amount),
  };
}

Page({
  data: {
    title: "师傅收益",
    earnings: [],
    loading: true,
  },

  onShow() {
    this.loadEarnings();
  },

  async loadEarnings() {
    this.setData({ loading: true });
    try {
      const data = await financeService.adminGetWorkerEarnings();
      this.setData({ earnings: (data.earnings || []).map(mapEarning) });
    } catch (error) {
      showError(error.message || "师傅收益加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goOrderFinance(event) {
    const orderId = event.currentTarget.dataset.orderId;
    if (!orderId) return;
    wx.navigateTo({
      url: `/pages/admin/order-finance-detail/order-finance-detail?orderId=${orderId}`,
    });
  },
});
