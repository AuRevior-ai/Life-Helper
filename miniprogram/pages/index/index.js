const serviceService = require("../../services/service.service");
const { showError } = require("../../utils/toast");

const FALLBACK_CATEGORIES = [
  {
    _id: "cat_housekeeping",
    name: "家政保洁",
    tone: "cleaning",
    iconPath: "/assets/home/category-housekeeping.png",
  },
  {
    _id: "cat_repair",
    name: "维修服务",
    tone: "repair",
    iconPath: "/assets/home/category-repair.png",
  },
  {
    _id: "cat_pet",
    name: "宠物服务",
    tone: "pet",
    iconPath: "/assets/home/category-pet.png",
  },
];

const COMMON_SERVICES = [
  {
    _id: "svc_home_daily_clean",
    title: "日常保洁",
    desc: "专业保洁阿姨，深度清洁",
    duration: "约2小时",
    priceText: "¥99起",
    tone: "cleaning",
    coverPath: "/assets/home/service-cleaning.png",
  },
  {
    _id: "svc_repair_water",
    title: "水电维修",
    desc: "水电故障维修，快速上门",
    duration: "约1小时",
    priceText: "¥99起",
    tone: "repair",
    coverPath: "/assets/home/service-repair.png",
  },
  {
    _id: "svc_pet_feed",
    title: "宠物上门喂养",
    desc: "上门喂养遛狗，贴心照料",
    duration: "约30分钟",
    priceText: "¥99起",
    tone: "pet",
    coverPath: "/assets/home/service-pet-feeding.png",
  },
];

const BANNER_BADGES = ["专业可靠", "快速响应", "安心保障"];

function buildDisplayCategories(categories) {
  const source =
    categories && categories.length ? categories : FALLBACK_CATEGORIES;
  const tones = ["cleaning", "repair", "pet"];

  return source.slice(0, 3).map((category, index) => ({
    _id: category._id || FALLBACK_CATEGORIES[index]._id,
    name: category.name || FALLBACK_CATEGORIES[index].name,
    tone: tones[index],
    iconPath: FALLBACK_CATEGORIES[index].iconPath,
  }));
}

Page({
  data: {
    title: "首页",
    loading: true,
    categories: [],
    displayCategories: FALLBACK_CATEGORIES,
    recommendedServices: [],
    commonServices: COMMON_SERVICES,
    bannerBadges: BANNER_BADGES,
  },

  onLoad() {
    this.loadHomeData();
  },

  onShow() {
    this.setActiveTabBar();
  },

  setActiveTabBar() {
    if (typeof this.getTabBar === "function" && this.getTabBar()) {
      this.getTabBar().setData({
        selected: 0,
      });
    }
  },

  async loadHomeData() {
    this.setData({ loading: true });
    try {
      const [categoryData, serviceData] = await Promise.all([
        serviceService.getCategoryList(),
        serviceService.getServiceList({ recommended: true }),
      ]);

      this.setData({
        categories: categoryData.categories || [],
        displayCategories: buildDisplayCategories(
          categoryData.categories || [],
        ),
        recommendedServices: serviceData.services || [],
      });
    } catch (error) {
      showError(error.message || "首页数据加载失败");
      this.setData({
        displayCategories: FALLBACK_CATEGORIES,
      });
    } finally {
      this.setData({ loading: false });
    }
  },

  goServiceList(event) {
    const categoryId =
      event && event.currentTarget && event.currentTarget.dataset.id;
    wx.navigateTo({
      url: categoryId
        ? `/pages/service-list/service-list?categoryId=${categoryId}`
        : "/pages/service-list/service-list",
    });
  },

  goServiceDetail(event) {
    const serviceId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/service-detail/service-detail?serviceId=${serviceId}`,
    });
  },
});
