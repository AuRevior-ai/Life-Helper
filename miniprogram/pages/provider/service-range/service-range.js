const workerService = require("../../../services/worker.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: {
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
});
