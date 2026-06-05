const workerService = require("../../../services/worker.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: {
    title: "师傅审核",
    workers: [],
    filterPills: ["待审核", "人工审核", "资料复核"],
    loading: true,
    errorText: "",
    submittingId: "",
  },

  onShow() {
    this.loadWorkerApplyList();
  },

  onPullDownRefresh() {
    this.loadWorkerApplyList().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadWorkerApplyList() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await workerService.getWorkerApplyList({
        status: "pending",
      });
      this.setData({
        workers: data.workers || [],
      });
    } catch (error) {
      const errorText = error.message || "审核列表加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  async approveWorker(event) {
    const workerId = event.currentTarget.dataset.id;
    this.setData({ submittingId: workerId });
    try {
      await workerService.approveWorker({ workerId });
      showSuccess("已通过");
      this.loadWorkerApplyList();
    } catch (error) {
      showError(error.message || "审核失败");
    } finally {
      this.setData({ submittingId: "" });
    }
  },

  goWorkerDetail(event) {
    const workerId = event.currentTarget.dataset.id;
    if (!workerId) return;
    wx.navigateTo({
      url: `/pages/worker-detail/worker-detail?workerId=${workerId}&mode=admin`,
    });
  },

  rejectWorker(event) {
    const workerId = event.currentTarget.dataset.id;
    wx.showModal({
      title: "拒绝申请",
      content: "确认拒绝该师傅入驻申请吗？",
      confirmColor: "#c66b2d",
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ submittingId: workerId });
        try {
          await workerService.rejectWorker({
            workerId,
            reason: "暂未通过审核",
          });
          showSuccess("已拒绝");
          this.loadWorkerApplyList();
        } catch (error) {
          showError(error.message || "审核失败");
        } finally {
          this.setData({ submittingId: "" });
        }
      },
    });
  },
});
