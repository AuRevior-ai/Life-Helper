const merchantService = require("../../../services/merchant.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: { merchantId: "", merchant: {} },
  onLoad(options = {}) {
    this.setData({ merchantId: options.merchantId || "" });
    this.loadDetail();
  },

  async loadDetail() {
    try {
      const data = await merchantService.adminGetMerchantDetail({
        merchantId: this.data.merchantId,
      });
      this.setData({ merchant: data.merchant || {} });
    } catch (error) {
      showError(error.message || "商家详情加载失败");
    }
  },

  async approve() {
    try {
      await merchantService.adminApproveMerchant({
        merchantId: this.data.merchantId,
      });
      showSuccess("商家审核已通过");
      await this.loadDetail();
    } catch (error) {
      showError(error.message || "操作失败");
    }
  },

  async reject() {
    try {
      await merchantService.adminRejectMerchant({
        merchantId: this.data.merchantId,
        reason: "资料不完整",
      });
      showSuccess("商家审核已拒绝");
      await this.loadDetail();
    } catch (error) {
      showError(error.message || "操作失败");
    }
  },

  async enable() {
    try {
      await merchantService.adminEnableMerchant({
        merchantId: this.data.merchantId,
      });
      showSuccess("商家已启用");
      await this.loadDetail();
    } catch (error) {
      showError(error.message || "操作失败");
    }
  },

  async disable() {
    try {
      await merchantService.adminDisableMerchant({
        merchantId: this.data.merchantId,
      });
      showSuccess("商家已停用");
      await this.loadDetail();
    } catch (error) {
      showError(error.message || "操作失败");
    }
  },
});
