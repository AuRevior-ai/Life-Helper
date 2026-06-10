const tipService = require("../../../services/tip.service");
const { formatPrice } = require("../../../utils/format");
const { formatDateTime } = require("../../../utils/date");
const { showError } = require("../../../utils/toast");

function mapTip(tip) {
  return {
    ...tip,
    amountText: formatPrice(tip.amount),
    incomeText: formatPrice(tip.worker_tip_income || 0),
    timeText: formatDateTime(tip.created_at || tip.updated_at) || "时间待确认",
    statusText: tip.status === "paid" ? "已记录" : "内部模拟",
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

  goBack() {
    const pages = typeof getCurrentPages === "function" ? getCurrentPages() : [];
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.redirectTo({
      url: "/pages/worker/profile/profile",
    });
  },
});
