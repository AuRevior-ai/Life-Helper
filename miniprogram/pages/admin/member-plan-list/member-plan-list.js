const promotionService = require("../../../services/promotion.service");
const { MEMBER_LEVEL_TEXT, MEMBER_STATUS_TEXT } = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

function mapPlan(plan = {}) {
  const discountRate = Number(plan.discount_rate || 0);
  return {
    ...plan,
    levelText: MEMBER_LEVEL_TEXT[plan.level] || plan.name,
    statusText: MEMBER_STATUS_TEXT[plan.status] || plan.status || "未配置",
    statusClass: plan.status === "active" ? "is-active" : "is-muted",
    priceText: formatPrice(plan.price),
    durationText: `${Number(plan.duration_days || 0)} 天`,
    discountText: discountRate ? `${Math.round(discountRate * 100) / 10} 折` : "未配置",
    benefitText: Array.isArray(plan.benefits) && plan.benefits.length
      ? plan.benefits.join("、")
      : "未配置权益说明",
  };
}

Page({
  data: {
    title: "会员方案",
    plans: [],
    loading: true,
    errorText: "",
    filterPills: ["mock 会员", "仅展示方案", "无真实会员扣款", "后端为准"],
  },

  onShow() {
    this.loadPlans();
  },

  async loadPlans() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await promotionService.adminGetMemberPlans();
      this.setData({ plans: (data.plans || []).map(mapPlan) });
    } catch (error) {
      const errorText = error.message || "会员方案加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },
});
