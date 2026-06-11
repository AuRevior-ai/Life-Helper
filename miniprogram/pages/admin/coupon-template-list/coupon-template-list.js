const promotionService = require("../../../services/promotion.service");
const {
  COUPON_STATUS,
  COUPON_STATUS_TEXT,
  COUPON_TYPE_TEXT,
} = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError, showSuccess } = require("../../../utils/toast");

function mapTemplate(template = {}) {
  const totalQuantity = Number(template.total_quantity || 0);
  const receivedQuantity = Number(template.received_quantity || 0);
  const usedQuantity = Number(template.used_quantity || 0);
  return {
    ...template,
    typeText: COUPON_TYPE_TEXT[template.type] || template.type,
    statusText: COUPON_STATUS_TEXT[template.status] || template.status,
    statusClass: template.status === COUPON_STATUS.ACTIVE ? "is-active" : "is-muted",
    amountText: formatPrice(template.amount),
    thresholdText: Number(template.threshold_amount || 0)
      ? formatPrice(template.threshold_amount)
      : "无门槛",
    quantityText: `${receivedQuantity} / ${totalQuantity || "不限"}`,
    usedText: `${usedQuantity}`,
    canEnable: template.status !== COUPON_STATUS.ACTIVE,
    canDisable: template.status === COUPON_STATUS.ACTIVE,
  };
}

Page({
  data: {
    title: "优惠券管理",
    templates: [],
    loading: true,
    errorText: "",
    submittingId: "",
    filterPills: ["mock 优惠券", "模板配置", "无真实营销结算", "后端为准"],
  },

  onShow() {
    this.loadTemplates();
  },

  async loadTemplates() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await promotionService.adminGetCouponTemplates();
      this.setData({ templates: (data.templates || []).map(mapTemplate) });
    } catch (error) {
      const errorText = error.message || "优惠券模板加载失败";
      this.setData({ errorText });
      showError(errorText);
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
    const couponTemplateId = event.currentTarget.dataset.id;
    const template = this.data.templates.find((item) => item._id === couponTemplateId);
    if (template && typeof wx !== "undefined" && wx.setStorageSync) {
      wx.setStorageSync("adminCouponTemplateDraft", template);
    }
    wx.navigateTo({
      url: `/pages/admin/coupon-template-edit/coupon-template-edit?couponTemplateId=${couponTemplateId}`,
    });
  },

  async toggleTemplateStatus(event) {
    const { id, action } = event.currentTarget.dataset;
    if (!id || this.data.submittingId) return;
    this.setData({ submittingId: id, errorText: "" });
    try {
      if (action === "enable") {
        await promotionService.adminEnableCouponTemplate({ couponTemplateId: id });
        showSuccess("已启用");
      } else {
        await promotionService.adminDisableCouponTemplate({ couponTemplateId: id });
        showSuccess("已停用");
      }
      await this.loadTemplates();
    } catch (error) {
      const errorText = error.message || "优惠券模板操作失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ submittingId: "" });
    }
  },
});
