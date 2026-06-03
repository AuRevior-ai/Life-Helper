const dispatchService = require("../../../services/dispatch.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: {
    title: "指派师傅",
    orderId: "",
    workers: [],
    reason: "",
    loading: true,
    submittingId: "",
  },

  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || "" });
    this.loadWorkers();
  },

  async loadWorkers() {
    this.setData({ loading: true });
    try {
      const data = await dispatchService.getAssignableWorkers({
        orderId: this.data.orderId,
      });
      this.setData({ workers: data.workers || [] });
    } catch (error) {
      showError(error.message || "可指派师傅加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  handleReasonInput(event) {
    this.setData({ reason: event.detail.value });
  },

  async assignWorker(event) {
    const workerId = event.currentTarget.dataset.id;
    this.setData({ submittingId: workerId });
    try {
      await dispatchService.adminAssignOrder({
        orderId: this.data.orderId,
        workerId,
        reason: this.data.reason || "管理员人工派单",
      });
      showSuccess("已指派师傅");
      wx.navigateBack();
    } catch (error) {
      showError(error.message || "指派失败");
    } finally {
      this.setData({ submittingId: "" });
    }
  },
});
