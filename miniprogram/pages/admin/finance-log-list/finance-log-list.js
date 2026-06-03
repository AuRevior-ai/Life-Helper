const financeService = require("../../../services/finance.service");
const {
  FINANCE_LOG_DIRECTION_TEXT,
  FINANCE_LOG_TYPE_TEXT,
} = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

function mapLog(log = {}) {
  return {
    ...log,
    typeText: FINANCE_LOG_TYPE_TEXT[log.type] || log.type,
    directionText: FINANCE_LOG_DIRECTION_TEXT[log.direction] || log.direction,
    amountText: formatPrice(log.amount),
  };
}

Page({
  data: {
    title: "财务流水",
    logs: [],
    loading: true,
  },

  onShow() {
    this.loadLogs();
  },

  async loadLogs() {
    this.setData({ loading: true });
    try {
      const data = await financeService.adminGetFinanceLogs();
      this.setData({ logs: (data.logs || []).map(mapLog) });
    } catch (error) {
      showError(error.message || "财务流水加载失败");
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
