const serviceService = require("../../services/service.service");
const { formatPrice } = require("../../utils/format");
const { showError } = require("../../utils/toast");

Page({
  data: {
    title: "服务详情",
    serviceId: "",
    service: null,
    priceText: "¥0.00",
    loadError: "",
    loading: true,
  },

  onLoad(options = {}) {
    this.setData({
      serviceId: options.serviceId || "",
    });
    this.loadServiceDetail();
  },

  async loadServiceDetail() {
    if (!this.data.serviceId) {
      this.setData({ loading: false, loadError: "缺少服务 ID" });
      showError("缺少服务 ID");
      return;
    }

    this.setData({ loading: true, loadError: "" });
    try {
      const data = await serviceService.getServiceDetail({
        serviceId: this.data.serviceId,
      });
      const service = data.service;
      this.setData({
        service,
        title: service.name,
        priceText: formatPrice(service.price),
        loadError: "",
      });
      wx.setNavigationBarTitle({
        title: service.name,
      });
    } catch (error) {
      this.setData({
        service: null,
        loadError: error.message || "服务详情加载失败",
      });
      showError(error.message || "服务详情加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goSubmitOrder() {
    if (!this.data.serviceId) {
      showError("缺少服务 ID");
      return;
    }

    wx.navigateTo({
      url: `/pages/order-submit/order-submit?serviceId=${this.data.serviceId}`,
    });
  },
});
