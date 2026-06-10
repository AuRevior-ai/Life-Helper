const workerService = require("../../../services/worker.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: {
    modeOptions: [
      { value: "admin_area", label: "行政区服务范围" },
      { value: "radius", label: "半径服务范围" },
    ],
    form: {
      service_range_mode: "admin_area",
      base_latitude: "",
      base_longitude: "",
      base_address: "",
      service_radius_km: 3,
      service_communities: "未来小区",
    },
  },

  onInput(event) {
    this.setData({
      [`form.${event.currentTarget.dataset.field}`]: event.detail.value,
    });
  },

  onModeTap(event) {
    const mode = event.currentTarget.dataset.mode;
    if (!mode) return;
    this.setData({
      "form.service_range_mode": mode,
    });
  },

  openPickLocation() {
    wx.navigateTo({ url: "/pages/map/pick-location/pick-location" });
  },

  async submit() {
    try {
      await workerService.updateWorkerServiceRange({
        ...this.data.form,
        service_communities: `${this.data.form.service_communities || ""}`
          .split(/[,，、\s]+/)
          .filter(Boolean),
      });
      showSuccess("服务范围已保存");
    } catch (error) {
      showError(error.message || "保存失败");
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
