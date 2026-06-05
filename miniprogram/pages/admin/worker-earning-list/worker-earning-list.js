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
    serviceText: earning.service_name || earning.order_no || "未记录服务",
    orderText: earning.order_no || earning.order_id || "未关联订单",
    workerText: earning.worker_id || earning.provider_id || "未关联服务方",
  };
}

Page({
  data: {
    title: "师傅收益",
    earnings: [],
    loading: true,
    errorText: "",
    filterPills: ["全部收益", "历史师傅命名兼容", "无真实提现"],
  },

  onShow() {
    this.loadEarnings();
  },

  async loadEarnings() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await financeService.adminGetWorkerEarnings();
      this.setData({ earnings: (data.earnings || []).map(mapEarning) });
    } catch (error) {
      const errorText = error.message || "师傅收益加载失败";
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
