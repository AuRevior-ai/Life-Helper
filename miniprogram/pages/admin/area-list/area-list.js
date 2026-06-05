const areaService = require("../../../services/area.service");
const { showError, showSuccess } = require("../../../utils/toast");

function mapArea(area) {
  const latitude = area.latitude || area.center_latitude || "";
  const longitude = area.longitude || area.center_longitude || "";
  const isEnabled = area.status === "enabled";

  return {
    ...area,
    titleText: area.full_name || [area.city, area.district, area.community].filter(Boolean).join(" / ") || "未命名区域",
    statusText: isEnabled ? "启用中" : "已停用",
    statusClass: isEnabled ? "is-active" : "is-muted",
    locationText: latitude && longitude ? `${latitude}，${longitude}` : "未填写中心点",
    adcodeText: area.adcode || "未填写行政区编码",
    nextStatusText: isEnabled ? "禁用" : "启用",
  };
}

Page({
  data: {
    title: "区域管理",
    areas: [],
    collectionMissing: false,
    loading: true,
    errorText: "",
    submittingId: "",
    filterPills: ["全部区域", "含停用", "手动配置"],
  },

  onShow() {
    this.loadAreas();
  },

  async loadAreas() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await areaService.getServiceAreaList({
        includeDisabled: true,
      });
      this.setData({
        areas: (data.areas || []).map(mapArea),
        collectionMissing: data.collection_missing === true,
      });
    } catch (error) {
      const errorText = error.message || "区域加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  goCreate() {
    wx.navigateTo({ url: "/pages/admin/area-edit/area-edit" });
  },

  goEdit(event) {
    wx.navigateTo({
      url: `/pages/admin/area-edit/area-edit?areaId=${event.currentTarget.dataset.id}`,
    });
  },

  async toggleStatus(event) {
    const { id, status } = event.currentTarget.dataset;
    this.setData({ submittingId: id });
    try {
      if (status === "enabled") {
        await areaService.adminDisableServiceArea({ areaId: id });
      } else {
        await areaService.adminEnableServiceArea({ areaId: id });
      }
      showSuccess("区域状态已更新");
      this.loadAreas();
    } catch (error) {
      showError(error.message || "状态更新失败");
    } finally {
      this.setData({ submittingId: "" });
    }
  },
});
