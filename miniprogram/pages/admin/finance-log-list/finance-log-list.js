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
    orderText: log.order_no || log.order_id || "未关联订单",
    workerText: log.worker_id || log.provider_id || "未关联服务方",
    statusText: log.status || "已记录",
    timeText: log.created_at || log.create_time || "未记录时间",
  };
}

Page({
  data: {
    title: "财务流水",
    logs: [],
    loading: true,
    errorText: "",
    filterPills: ["全部流水", "内部模拟流水", "无真实清算"],
  },

  onShow() {
    this.loadLogs();
  },

  async loadLogs() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await financeService.adminGetFinanceLogs();
      this.setData({ logs: (data.logs || []).map(mapLog) });
    } catch (error) {
      const errorText = error.message || "财务流水加载失败";
      this.setData({ errorText });
      showError(errorText);
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
