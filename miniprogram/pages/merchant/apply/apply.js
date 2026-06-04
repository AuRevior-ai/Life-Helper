const merchantService = require("../../../services/merchant.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: {
    form: {
      storeName: "",
      contactName: "",
      contactPhone: "",
      storeIntro: "",
    },
    submitting: false,
    errorText: "",
  },

  onInput(event) {
    this.setData({
      [`form.${event.currentTarget.dataset.field}`]: event.detail.value,
    });
  },

  async submit() {
    if (this.data.submitting) {
      return;
    }

    this.setData({ submitting: true, errorText: "" });
    try {
      await merchantService.applyMerchant(this.data.form);
      showSuccess("商家入驻申请已提交");
      wx.navigateTo({ url: "/pages/merchant/audit-status/audit-status" });
    } catch (error) {
      this.setData({ errorText: error.message || "提交失败" });
      showError(error.message || "提交失败");
    } finally {
      this.setData({ submitting: false });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
