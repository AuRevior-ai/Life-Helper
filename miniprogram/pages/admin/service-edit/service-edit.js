const serviceService = require("../../../services/service.service");
const { formatPrice } = require("../../../utils/format");
const { showError, showSuccess } = require("../../../utils/toast");

function centsToYuan(value) {
  return (Number(value || 0) / 100).toFixed(2);
}

function yuanToCents(value) {
  return Math.round(Number(value || 0) * 100);
}

Page({
  data: {
    title: "编辑服务",
    serviceId: "",
    categories: [],
    categoryNames: [],
    categoryIndex: 0,
    selectedCategoryName: "请先创建分类",
    name: "",
    description: "",
    duration: "",
    price: "",
    sort: 0,
    status: "on",
    recommended: false,
    statusOptions: ["上架", "下架"],
    statusValues: ["on", "off"],
    statusIndex: 0,
    loading: true,
    errorText: "",
    submitting: false,
  },

  onLoad(options = {}) {
    this.setData({
      serviceId: options.serviceId || "",
    });
    this.loadFormData();
  },

  async loadFormData() {
    this.setData({ loading: true, errorText: "" });
    try {
      const categoryData = await serviceService.getCategoryList({
        includeDisabled: true,
      });
      const categories = categoryData.categories || [];
      this.setData({
        categories,
        categoryNames: categories.map((category) => category.name),
        selectedCategoryName: categories[0]
          ? categories[0].name
          : "请先创建分类",
      });

      if (this.data.serviceId) {
        const serviceData = await serviceService.getServiceDetail({
          serviceId: this.data.serviceId,
          includeOff: true,
        });
        this.applyService(serviceData.service || {});
      }
    } catch (error) {
      const errorText = error.message || "服务信息加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  applyService(service) {
    const categoryIndex = Math.max(
      this.data.categories.findIndex(
        (category) => category._id === service.category_id,
      ),
      0,
    );
    const statusIndex = service.status === "off" ? 1 : 0;
    this.setData({
      categoryIndex,
      selectedCategoryName:
        this.data.categoryNames[categoryIndex] || "请先创建分类",
      statusIndex,
      status: service.status || "on",
      name: service.name || "",
      description: service.description || "",
      duration: service.duration || "",
      price: centsToYuan(service.price),
      sort: Number(service.sort || 0),
      recommended: Boolean(service.recommended),
    });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [field]: event.detail.value,
    });
  },

  onCategoryChange(event) {
    const categoryIndex = Number(event.detail.value || 0);
    this.setData({
      categoryIndex,
      selectedCategoryName:
        this.data.categoryNames[categoryIndex] || "请先创建分类",
    });
  },

  onStatusChange(event) {
    const statusIndex = Number(event.detail.value || 0);
    this.setData({
      statusIndex,
      status: this.data.statusValues[statusIndex],
    });
  },

  onRecommendedChange(event) {
    this.setData({
      recommended: Boolean(event.detail.value),
    });
  },

  async saveService() {
    const category = this.data.categories[this.data.categoryIndex] || {};
    const payload = {
      categoryId: category._id,
      categoryName: category.name,
      name: `${this.data.name || ""}`.trim(),
      description: `${this.data.description || ""}`.trim(),
      duration: `${this.data.duration || ""}`.trim(),
      price: yuanToCents(this.data.price),
      sort: Number(this.data.sort || 0),
      status: this.data.status,
      recommended: this.data.recommended,
    };

    if (!payload.categoryId) {
      showError("请先同步或创建服务分类");
      return;
    }
    if (!payload.name) {
      showError("请填写服务名称");
      return;
    }

    this.setData({ submitting: true });
    try {
      if (this.data.serviceId) {
        await serviceService.updateService({
          serviceId: this.data.serviceId,
          ...payload,
        });
      } else {
        await serviceService.createService(payload);
      }
      showSuccess(`服务已保存 ${formatPrice(payload.price)}`);
      wx.navigateBack();
    } catch (error) {
      showError(error.message || "保存失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
