const merchantService = require("../../../services/merchant.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: { form: { serviceId: "", price: "" } },
  onInput(event) {
    this.setData({
      [`form.${event.currentTarget.dataset.field}`]: event.detail.value,
    });
  },

  async submit() {
    try {
      await merchantService.createMerchantService(this.data.form);
      showSuccess("商家服务已保存");
      wx.navigateBack();
    } catch (error) {
      showError(error.message || "保存失败");
    }
  },
});
