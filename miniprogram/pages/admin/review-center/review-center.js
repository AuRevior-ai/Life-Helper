const adminService = require("../../../services/admin.service");
const { showError } = require("../../../utils/toast");

function normalizeStats(stats = {}) {
  return {
    pendingWorkerCount: Number(
      stats.pending_worker_count || stats.pendingWorkerCount || 0,
    ),
    pendingMerchantCount: Number(
      stats.pending_merchant_count || stats.pendingMerchantCount || 0,
    ),
    pendingQualificationCount: Number(
      stats.pending_qualification_count || stats.pendingQualificationCount || 0,
    ),
  };
}

Page({
  data: {
    loading: true,
    stats: normalizeStats(),
  },

  onShow() {
    this.loadReviewStats();
  },

  async loadReviewStats() {
    this.setData({ loading: true });
    try {
      const data = await adminService.getDashboard();
      this.setData({
        stats: normalizeStats(data.stats || {}),
      });
    } catch (error) {
      showError(error.message || "审核数据加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goEntry(event) {
    const url = event.currentTarget.dataset.url;
    if (!url) return;
    wx.navigateTo({ url });
  },
});
