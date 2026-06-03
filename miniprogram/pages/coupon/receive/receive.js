const promotionService = require("../../../services/promotion.service");
const { COUPON_TYPE_TEXT } = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError, showSuccess } = require("../../../utils/toast");

function mapTemplate(template = {}) {
  return {
    ...template,
    typeText: COUPON_TYPE_TEXT[template.type] || template.type,
    amountText: formatPrice(template.amount),
  };
}

Page({
  data: {
    title: "领券中心",
    templates: [],
    loading: true,
  },

  onShow() {
    this.loadTemplates();
  },

  async loadTemplates() {
    this.setData({ loading: true });
    try {
      const data = await promotionService.getReceivableCoupons();
      this.setData({ templates: (data.templates || []).map(mapTemplate) });
    } catch (error) {
      showError(error.message || "可领优惠券加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  async receiveCoupon(event) {
    const couponTemplateId = event.currentTarget.dataset.id;
    try {
      await promotionService.receiveCoupon({ couponTemplateId });
      showSuccess("领取成功");
      this.loadTemplates();
    } catch (error) {
      showError(error.message || "领取失败");
    }
  },
});
