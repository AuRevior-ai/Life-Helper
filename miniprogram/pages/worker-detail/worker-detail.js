const workerService = require("../../services/worker.service");
const { showError } = require("../../utils/toast");

Page({
  data: {
    title: "师傅详情",
    workerId: "",
    worker: null,
    reviews: [],
    completedCount: 0,
    averageRating: 0,
    loading: true,
  },

  onLoad(options = {}) {
    this.setData({
      workerId: options.workerId || "",
    });
    this.loadWorkerDetail();
  },

  async loadWorkerDetail() {
    if (!this.data.workerId) {
      this.setData({ loading: false });
      showError("缺少师傅 ID");
      return;
    }

    this.setData({ loading: true });
    try {
      const data = await workerService.getWorkerDetail({
        workerId: this.data.workerId,
      });
      this.setData({
        worker: data.worker,
        reviews: data.reviews || [],
        completedCount: data.completed_count || 0,
        averageRating: data.average_rating || 0,
      });
    } catch (error) {
      showError(error.message || "师傅详情加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },
});
