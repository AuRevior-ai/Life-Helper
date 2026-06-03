const promotionService = require("../../../services/promotion.service");
const { MEMBER_LEVEL_TEXT } = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

function mapPlan(plan = {}) {
  return {
    ...plan,
    levelText: MEMBER_LEVEL_TEXT[plan.level] || plan.name,
    priceText: formatPrice(plan.price),
  };
}

Page({
  data: {
    title: "会员方案",
    plans: [],
    loading: true,
  },

  onShow() {
    this.loadPlans();
  },

  async loadPlans() {
    this.setData({ loading: true });
    try {
      const data = await promotionService.adminGetMemberPlans();
      this.setData({ plans: (data.plans || []).map(mapPlan) });
    } catch (error) {
      showError(error.message || "会员方案加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },
});
