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
  },

  onInput(event) {
    this.setData({
      [`form.${event.currentTarget.dataset.field}`]: event.detail.value,
    });
  },

  async submit() {
    try {
      await merchantService.applyMerchant(this.data.form);
      showSuccess("商家入驻申请已提交");
      wx.navigateTo({ url: "/pages/merchant/audit-status/audit-status" });
    } catch (error) {
      showError(error.message || "提交失败");
    }
  },
});
