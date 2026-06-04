const financeService = require("../../../services/finance.service");
const { WORKER_EARNING_STATUS_TEXT } = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { getStatusView } = require("../../../utils/status-view");
const { showError } = require("../../../utils/toast");

function mapEarning(earning = {}) {
  const statusView = getStatusView("finance", earning.status);
  return {
    ...earning,
    statusText: WORKER_EARNING_STATUS_TEXT[earning.status] || earning.status,
    statusView,
    workerEarningText: formatPrice(earning.worker_earning_amount),
    commissionText: formatPrice(earning.platform_commission_amount),
    paidAmountText: formatPrice(earning.paid_amount),
    serviceName: earning.service_name || "收益记录",
    timeText: earning.appointment_time || earning.created_at || "时间待确认",
    orderNoText: earning.order_no || "订单编号待确认",
  };
}

Page({
  data: {
    title: "我的收益",
    totalCount: 0,
    monthAmountText: "¥0.00",
    totalAmountText: "¥0.00",
    frozenAmountText: "¥0.00",
    settleableAmountText: "¥0.00",
    settledAmountText: "¥0.00",
    reversedAmountText: "¥0.00",
    earnings: [],
    loading: true,
  },

  onShow() {
    this.loadIncomeStats();
  },

  onPullDownRefresh() {
    this.loadIncomeStats().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadIncomeStats() {
    this.setData({ loading: true });
    try {
      const summary = await financeService.getWorkerIncomeSummary();
      const listData = await financeService.getWorkerEarningList();
      this.setData({
        totalCount: summary.total_count || 0,
        monthAmountText: formatPrice(
          summary.month_amount || summary.current_month_amount || 0,
        ),
        totalAmountText: formatPrice(summary.total_amount || 0),
        frozenAmountText: formatPrice(summary.frozen_amount || 0),
        settleableAmountText: formatPrice(summary.settleable_amount || 0),
        settledAmountText: formatPrice(summary.settled_amount || 0),
        reversedAmountText: formatPrice(summary.reversed_amount || 0),
        earnings: (listData.earnings || []).map(mapEarning),
      });
    } catch (error) {
      showError(error.message || "收入统计加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },
});
