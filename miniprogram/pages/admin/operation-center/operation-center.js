const adminService = require("../../../services/admin.service");
const { showError } = require("../../../utils/toast");

function normalizeStats(data = {}) {
  return {
    serviceCount: Number(data.service_count || data.serviceCount || 0),
    areaCount: Number(data.area_count || data.areaCount || 0),
    todayReviewCount: Number(data.today_review_count || data.todayReviewCount || 0),
  };
}

Page({
  data: {
    loading: true,
    stats: normalizeStats(),
  },

  onShow() {
    this.loadOperationStats();
  },

  async loadOperationStats() {
    this.setData({ loading: true });
    try {
      const data = await adminService.getServiceStats();
      this.setData({
        stats: normalizeStats(data),
      });
    } catch (error) {
      showError(error.message || "运营数据加载失败");
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
