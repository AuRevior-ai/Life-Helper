const promotionService = require("../../../services/promotion.service");
const {
  COUPON_STATUS,
  COUPON_STATUS_TEXT,
  COUPON_TYPE,
  COUPON_TYPE_TEXT,
} = require("../../../config/status");
const { showError, showSuccess } = require("../../../utils/toast");

const typeOptions = [
  {
    value: COUPON_TYPE.FULL_REDUCTION,
    text: COUPON_TYPE_TEXT[COUPON_TYPE.FULL_REDUCTION],
  },
  {
    value: COUPON_TYPE.AMOUNT_OFF,
    text: COUPON_TYPE_TEXT[COUPON_TYPE.AMOUNT_OFF],
  },
];

const statusOptions = [
  { value: COUPON_STATUS.DRAFT, text: COUPON_STATUS_TEXT[COUPON_STATUS.DRAFT] },
  { value: COUPON_STATUS.ACTIVE, text: COUPON_STATUS_TEXT[COUPON_STATUS.ACTIVE] },
  {
    value: COUPON_STATUS.DISABLED,
    text: COUPON_STATUS_TEXT[COUPON_STATUS.DISABLED],
  },
];

function getOptionIndex(options, value) {
  const index = options.findIndex((item) => item.value === value);
  return index >= 0 ? index : 0;
}

function buildForm(template = {}) {
  return {
    name: template.name || "",
    type: template.type || COUPON_TYPE.FULL_REDUCTION,
    amount: Number(template.amount || 1000),
    threshold_amount: Number(template.threshold_amount || 10000),
    total_quantity: Number(template.total_quantity || 100),
    per_user_limit: Number(template.per_user_limit || 1),
    valid_days_after_receive: Number(template.valid_days_after_receive || 7),
    status: template.status || COUPON_STATUS.ACTIVE,
  };
}

Page({
  data: {
    title: "优惠券编辑",
    couponTemplateId: "",
    form: buildForm(),
    typeOptions,
    statusOptions,
    typeIndex: 0,
    statusIndex: 1,
    submitting: false,
    errorText: "",
  },

  onLoad(options = {}) {
    const couponTemplateId = options.couponTemplateId || "";
    let form = buildForm();
    if (couponTemplateId && typeof wx !== "undefined" && wx.getStorageSync) {
      const stored = wx.getStorageSync("adminCouponTemplateDraft");
      if (stored && stored._id === couponTemplateId) form = buildForm(stored);
    }
    this.setData({
      title: couponTemplateId ? "编辑优惠券" : "新增优惠券",
      couponTemplateId,
      form,
      typeIndex: getOptionIndex(typeOptions, form.type),
      statusIndex: getOptionIndex(statusOptions, form.status),
    });
  },

  handleInput(event) {
    const field = event.currentTarget.dataset.field;
    this.setData({
      [`form.${field}`]: event.detail.value,
    });
  },

  handlePickerChange(event) {
    const field = event.currentTarget.dataset.field;
    const index = Number(event.detail.value || 0);
    const options = field === "type" ? typeOptions : statusOptions;
    this.setData({
      [`${field}Index`]: index,
      [`form.${field}`]: options[index].value,
    });
  },

  async submitForm() {
    if (!`${this.data.form.name || ""}`.trim()) {
      const errorText = "请填写优惠券名称";
      this.setData({ errorText });
      showError(errorText);
      return;
    }

    this.setData({ submitting: true, errorText: "" });
    try {
      const data = {
        ...this.data.form,
        name: `${this.data.form.name || ""}`.trim(),
        amount: Number(this.data.form.amount || 0),
        threshold_amount: Number(this.data.form.threshold_amount || 0),
        total_quantity: Number(this.data.form.total_quantity || 0),
        per_user_limit: Number(this.data.form.per_user_limit || 1),
        valid_days_after_receive: Number(
          this.data.form.valid_days_after_receive || 7,
        ),
      };

      if (this.data.couponTemplateId) {
        await promotionService.adminUpdateCouponTemplate({
          couponTemplateId: this.data.couponTemplateId,
          ...data,
        });
      } else {
        await promotionService.adminCreateCouponTemplate(data);
      }

      showSuccess("已保存");
      if (typeof wx !== "undefined" && wx.removeStorageSync) {
        wx.removeStorageSync("adminCouponTemplateDraft");
      }
      wx.navigateBack();
    } catch (error) {
      const errorText = error.message || "保存失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ submitting: false });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
