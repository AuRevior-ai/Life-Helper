const promotionService = require("../../../services/promotion.service");
const {
  MEMBER_LEVEL_TEXT,
  MEMBER_STATUS_TEXT,
} = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { getStatusView } = require("../../../utils/status-view");
const { showError, showSuccess } = require("../../../utils/toast");

function mapPlan(plan = {}) {
  return {
    ...plan,
    levelText: MEMBER_LEVEL_TEXT[plan.level] || plan.name,
    priceText: formatPrice(plan.price),
  };
}

Page({
  data: {
    title: "会员中心",
    membership: null,
    membershipStatusText: "未开通",
    membershipStatusView: { text: "未开通", tone: "default" },
    plans: [],
    loading: true,
  },

  onShow() {
    this.loadMember();
  },

  async loadMember() {
    this.setData({ loading: true });
    try {
      const [plansData, memberData] = await Promise.all([
        promotionService.getMemberPlans(),
        promotionService.getMyMembership(),
      ]);
      const membership = memberData.membership || null;
      const membershipStatusView = membership
        ? getStatusView("member", membership.status)
        : { text: "未开通", tone: "default" };
      this.setData({
        plans: (plansData.plans || []).map(mapPlan),
        membership,
        membershipStatusText: membership
          ? `${MEMBER_LEVEL_TEXT[membership.level] || membership.level} · ${MEMBER_STATUS_TEXT[membership.status] || membership.status}`
          : "未开通",
        membershipStatusView,
      });
    } catch (error) {
      showError(error.message || "会员信息加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  async mockOpen(event) {
    const level = event.currentTarget.dataset.level;
    try {
      await promotionService.mockOpenMembership({ level });
      showSuccess("会员已开通");
      this.loadMember();
    } catch (error) {
      showError(error.message || "开通失败");
    }
  },
});
