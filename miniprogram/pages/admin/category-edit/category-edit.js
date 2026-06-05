const serviceService = require("../../../services/service.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: {
    title: "编辑分类",
    categoryId: "",
    name: "",
    icon: "",
    description: "",
    status: "enabled",
    sort: 0,
    statusOptions: ["启用", "停用"],
    statusValues: ["enabled", "disabled"],
    statusIndex: 0,
    errorText: "",
    submitting: false,
  },

  onLoad(options = {}) {
    const status = decodeURIComponent(options.status || "enabled");
    const statusIndex = status === "disabled" ? 1 : 0;
    this.setData({
      categoryId: decodeURIComponent(options.categoryId || ""),
      name: decodeURIComponent(options.name || ""),
      icon: decodeURIComponent(options.icon || ""),
      description: decodeURIComponent(options.description || ""),
      status,
      statusIndex,
      sort: Number(decodeURIComponent(options.sort || "0")),
    });
  },

  onInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [field]: event.detail.value,
    });
  },

  onStatusChange(event) {
    const statusIndex = Number(event.detail.value || 0);
    this.setData({
      statusIndex,
      status: this.data.statusValues[statusIndex],
    });
  },

  async saveCategory() {
    const payload = {
      name: `${this.data.name || ""}`.trim(),
      icon: `${this.data.icon || ""}`.trim(),
      description: `${this.data.description || ""}`.trim(),
      status: this.data.status,
      sort: Number(this.data.sort || 0),
    };

    if (!payload.name) {
      showError("请填写分类名称");
      return;
    }

    this.setData({ submitting: true });
    try {
      if (this.data.categoryId) {
        await serviceService.updateCategory({
          categoryId: this.data.categoryId,
          ...payload,
        });
      } else {
        await serviceService.createCategory(payload);
      }
      showSuccess("分类已保存");
      wx.navigateBack();
    } catch (error) {
      showError(error.message || "保存失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
