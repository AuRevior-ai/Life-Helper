const tipService = require("../../../services/tip.service");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

function mapTip(tip) {
  return {
    ...tip,
    amountText: formatPrice(tip.amount),
    incomeText: formatPrice(tip.worker_tip_income || 0),
    feeText: formatPrice(tip.platform_service_fee || 0),
    orderText: tip.order_no || tip.order_id || "未关联订单",
    workerText: tip.worker_id || "未关联服务方",
    statusText: tip.status || "已记录",
  };
}

Page({
  data: {
    title: "打赏记录",
    tips: [],
    loading: true,
    errorText: "",
    filterPills: ["全部打赏", "mock 打赏", "无真实打赏支付"],
  },
  onShow() {
    this.loadTips();
  },
  async loadTips() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await tipService.adminGetTipLogs();
      this.setData({ tips: (data.tips || []).map(mapTip) });
    } catch (error) {
      const errorText = error.message || "打赏记录加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },
});
