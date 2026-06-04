const merchantService = require("../../../services/merchant.service");
const { showError } = require("../../../utils/toast");

function normalizeService(service = {}) {
  return {
    ...service,
    id: service._id || service.id || "",
    serviceName: service.service_name || service.name || "未命名服务",
    statusText: service.status || "待完善",
    priceText: service.price ? `¥${(Number(service.price) / 100).toFixed(2)}` : "价格待完善",
  };
}

Page({
  data: {
    loading: true,
    services: [],
    displayServices: [],
  },

  onShow() {
    this.loadServices();
  },

  async loadServices() {
    this.setData({ loading: true });
    try {
      const data = await merchantService.getMerchantServiceList();
      const services = data.list || [];
      this.setData({
        services,
        displayServices: services.map(normalizeService),
      });
    } catch (error) {
      showError(error.message || "商家服务加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goCreate() {
    wx.navigateTo({ url: "/pages/merchant/service-edit/service-edit" });
  },
});
