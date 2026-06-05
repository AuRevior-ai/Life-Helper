const financeService = require("../../../services/finance.service");
const {
  FINANCE_LOG_TYPE_TEXT,
  WORKER_EARNING_STATUS_TEXT,
} = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

function mapLog(log = {}) {
  return {
    ...log,
    typeText: FINANCE_LOG_TYPE_TEXT[log.type] || log.type,
    amountText: formatPrice(log.amount),
    statusText: log.status || "已记录",
    sourceText: log.source || "内部模拟",
  };
}

function mapEarning(earning = {}) {
  return {
    ...earning,
    statusText: WORKER_EARNING_STATUS_TEXT[earning.status] || earning.status,
    earningText: formatPrice(earning.worker_earning_amount),
    commissionText: formatPrice(earning.platform_commission_amount),
    workerText: earning.worker_id || earning.provider_id || "未关联服务方",
  };
}

function mapOrder(order = {}) {
  return {
    ...order,
    orderText: order.order_no || order._id || "未记录订单号",
    serviceText: order.service_name || "未记录服务",
    financeStatusText: order.finance_generated ? "已生成" : "未生成",
    commissionText: formatPrice(order.platform_commission_amount),
    earningText: formatPrice(order.worker_earning_amount),
    reverseText: order.finance_reverse_status || "无回冲记录",
  };
}

Page({
  data: {
    title: "订单财务详情",
    orderId: "",
    order: {},
    logs: [],
    earnings: [],
    loading: true,
    errorText: "",
  },

  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || "" });
    this.loadDetail();
  },

  async loadDetail() {
    if (!this.data.orderId) {
      this.setData({ errorText: "缺少订单 ID", loading: false });
      showError("缺少订单 ID");
      return;
    }
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await financeService.adminGetOrderFinanceDetail({
        orderId: this.data.orderId,
      });
      this.setData({
        order: mapOrder(data.order || {}),
        logs: (data.logs || []).map(mapLog),
        earnings: (data.earnings || []).map(mapEarning),
      });
    } catch (error) {
      const errorText = error.message || "订单财务详情加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },
});
