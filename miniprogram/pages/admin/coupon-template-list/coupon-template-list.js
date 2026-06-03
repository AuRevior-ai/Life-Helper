const promotionService = require("../../../services/promotion.service");
const {
  COUPON_STATUS_TEXT,
  COUPON_TYPE_TEXT,
} = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

function mapTemplate(template = {}) {
  return {
    ...template,
    typeText: COUPON_TYPE_TEXT[template.type] || template.type,
    statusText: COUPON_STATUS_TEXT[template.status] || template.status,
    amountText: formatPrice(template.amount),
  };
}

Page({
  data: {
    title: "优惠券管理",
    templates: [],
    loading: true,
  },

  onShow() {
    this.loadTemplates();
  },

  async loadTemplates() {
    this.setData({ loading: true });
    try {
      const data = await promotionService.adminGetCouponTemplates();
      this.setData({ templates: (data.templates || []).map(mapTemplate) });
    } catch (error) {
      showError(error.message || "优惠券模板加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goCreate() {
    wx.navigateTo({
      url: "/pages/admin/coupon-template-edit/coupon-template-edit",
    });
  },

  goEdit(event) {
    wx.navigateTo({
      url: `/pages/admin/coupon-template-edit/coupon-template-edit?couponTemplateId=${event.currentTarget.dataset.id}`,
    });
  },
});
