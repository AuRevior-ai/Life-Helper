const dispatchService = require("../../../services/dispatch.service");
const { showError, showSuccess } = require("../../../utils/toast");

function mapWorker(worker) {
  return {
    ...worker,
    serviceText: worker.service_category || "未填写服务分类",
    areaText: worker.service_area || "未填写服务区域",
    statusText: worker.status || worker.work_status || "候选",
  };
}

Page({
  data: {
    title: "指派师傅",
    orderId: "",
    workers: [],
    reason: "",
    loading: true,
    errorText: "",
    submittingId: "",
    filterPills: ["可指派候选", "既有 LBS 基础能力", "非自动派单"],
  },

  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || "" });
    this.loadWorkers();
  },

  async loadWorkers() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await dispatchService.getAssignableWorkers({
        orderId: this.data.orderId,
      });
      this.setData({ workers: (data.workers || []).map(mapWorker) });
    } catch (error) {
      const errorText = error.message || "可指派师傅加载失败";
      this.setData({ errorText });
      showError(errorText);
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
