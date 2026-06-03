const serviceService = require("../../services/service.service");
const { showError } = require("../../utils/toast");

Page({
  data: {
    title: "服务列表",
    categoryId: "",
    categories: [],
    currentCategory: null,
    services: [],
    loading: true,
  },

  onLoad(options = {}) {
    this.setData({
      categoryId: options.categoryId || "",
    });
    this.loadPageData();
  },

  onPullDownRefresh() {
    this.loadPageData().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadPageData() {
    this.setData({ loading: true });
    try {
      const [categoryData, serviceData] = await Promise.all([
        serviceService.getCategoryList(),
        serviceService.getServiceList({ categoryId: this.data.categoryId }),
      ]);
      const categories = categoryData.categories || [];
      const currentCategory =
        categories.find((category) => category._id === this.data.categoryId) ||
        null;

      this.setData({
        categories,
        currentCategory,
        title: currentCategory ? currentCategory.name : "全部服务",
        services: serviceData.services || [],
      });

      if (currentCategory) {
        wx.setNavigationBarTitle({
          title: currentCategory.name,
        });
      }
    } catch (error) {
      showError(error.message || "服务列表加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  switchCategory(event) {
    const categoryId = event.currentTarget.dataset.id;
    this.setData({ categoryId });
    this.loadPageData();
  },

  goServiceDetail(event) {
    const serviceId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?serviceId=${serviceId}`,
    });
  },
});
