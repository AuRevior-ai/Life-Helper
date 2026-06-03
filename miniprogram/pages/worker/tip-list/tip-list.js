const tipService = require("../../../services/tip.service");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

function mapTip(tip) {
  return {
    ...tip,
    amountText: formatPrice(tip.amount),
    incomeText: formatPrice(tip.worker_tip_income || 0),
  };
}

Page({
  data: { title: "打赏记录", tips: [], loading: true },
  onShow() {
    this.loadTips();
  },
  async loadTips() {
    try {
      const data = await tipService.getWorkerTipList();
      this.setData({ tips: (data.tips || []).map(mapTip) });
    } catch (error) {
      showError(error.message || "打赏记录加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },
});
