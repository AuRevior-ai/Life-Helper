const merchantService = require("../../../services/merchant.service");
const { showError, showSuccess } = require("../../../utils/toast");

function mapMerchant(merchant = {}) {
  return {
    ...merchant,
    storeName: merchant.store_name || merchant.name || "未命名商家",
    auditText: merchant.audit_status || "未提交审核",
    statusText: merchant.status || "未记录经营状态",
    contactText: merchant.contact_phone || merchant.phone || "未填写联系方式",
    addressText: merchant.address || merchant.store_address || "未填写经营地址",
    merchantText: merchant._id || merchant.merchant_id || "未记录商家 ID",
  };
}

Page({
  data: {
    title: "商家详情",
    merchantId: "",
    merchant: {},
    loading: true,
    errorText: "",
    submitting: "",
  },
  onLoad(options = {}) {
    this.setData({ merchantId: options.merchantId || "" });
    this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await merchantService.adminGetMerchantDetail({
        merchantId: this.data.merchantId,
      });
      this.setData({ merchant: mapMerchant(data.merchant || {}) });
    } catch (error) {
      const errorText = error.message || "商家详情加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  async approve() {
    this.setData({ submitting: "approve" });
    try {
      await merchantService.adminApproveMerchant({
        merchantId: this.data.merchantId,
      });
      showSuccess("商家审核已通过");
      await this.loadDetail();
    } catch (error) {
      showError(error.message || "操作失败");
    } finally {
      this.setData({ submitting: "" });
    }
  },

  async reject() {
    this.setData({ submitting: "reject" });
    try {
      await merchantService.adminRejectMerchant({
        merchantId: this.data.merchantId,
        reason: "资料不完整",
      });
      showSuccess("商家审核已拒绝");
      await this.loadDetail();
    } catch (error) {
      showError(error.message || "操作失败");
    } finally {
      this.setData({ submitting: "" });
    }
  },

  async enable() {
    this.setData({ submitting: "enable" });
    try {
      await merchantService.adminEnableMerchant({
        merchantId: this.data.merchantId,
      });
      showSuccess("商家已启用");
      await this.loadDetail();
    } catch (error) {
      showError(error.message || "操作失败");
    } finally {
      this.setData({ submitting: "" });
    }
  },

  async disable() {
    this.setData({ submitting: "disable" });
    try {
      await merchantService.adminDisableMerchant({
        merchantId: this.data.merchantId,
      });
      showSuccess("商家已停用");
      await this.loadDetail();
    } catch (error) {
      showError(error.message || "操作失败");
    } finally {
      this.setData({ submitting: "" });
    }
  },
});
