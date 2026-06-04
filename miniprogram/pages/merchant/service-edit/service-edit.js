const merchantService = require("../../../services/merchant.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: {
    form: { serviceId: "", price: "" },
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
      await merchantService.createMerchantService(this.data.form);
      showSuccess("商家服务已保存");
      wx.navigateBack();
    } catch (error) {
      this.setData({ errorText: error.message || "保存失败" });
      showError(error.message || "保存失败");
    } finally {
      this.setData({ submitting: false });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
