const serviceService = require("../../../services/service.service");
const { formatPrice } = require("../../../utils/format");
const { showError, showSuccess } = require("../../../utils/toast");

function mapService(service) {
  return {
    ...service,
    priceText: formatPrice(service.price),
    statusText: service.status === "off" ? "已下架" : "上架中",
    statusClass: service.status === "off" ? "is-muted" : "is-active",
    categoryText: service.category_name || "未绑定分类",
    durationText: service.duration || "未填写时长",
    nextStatus: service.status === "off" ? "on" : "off",
    nextStatusText: service.status === "off" ? "上架" : "下架",
  };
}

Page({
  data: {
    title: "服务管理",
    services: [],
    loading: true,
    errorText: "",
    submittingId: "",
    seeding: false,
    filterPills: ["全部服务", "含下架", "后端为准"],
  },

  onShow() {
    this.loadServices();
  },

  onPullDownRefresh() {
    this.loadServices().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadServices() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await serviceService.getServiceList({
        includeOff: true,
      });
      this.setData({
        services: (data.services || []).map(mapService),
      });
    } catch (error) {
      const errorText = error.message || "服务加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  async seedServiceData() {
    this.setData({ seeding: true });
    try {
      await serviceService.seedServiceData();
      showSuccess("同步完成");
      await this.loadServices();
    } catch (error) {
      showError(error.message || "同步失败");
    } finally {
      this.setData({ seeding: false });
    }
  },

  async updateServiceStatus(event) {
    const serviceId = event.currentTarget.dataset.id;
    const status = event.currentTarget.dataset.status;
    this.setData({ submittingId: serviceId });
    try {
      await serviceService.updateServiceStatus({
        serviceId,
        status,
      });
      showSuccess("状态已更新");
      await this.loadServices();
    } catch (error) {
      showError(error.message || "状态更新失败");
    } finally {
      this.setData({ submittingId: "" });
    }
  },

  goCreateService() {
    wx.navigateTo({
      url: "/pages/admin/service-edit/service-edit",
    });
  },

  goEditService(event) {
    const serviceId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/service-edit/service-edit?serviceId=${serviceId}`,
    });
  },
});
