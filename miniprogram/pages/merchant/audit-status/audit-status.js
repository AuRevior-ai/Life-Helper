const merchantService = require("../../../services/merchant.service");
const { showError } = require("../../../utils/toast");

const STATUS_TEXT = Object.freeze({
  not_applied: "未申请",
  pending: "审核中",
  approved: "已通过",
  rejected: "已拒绝",
});

Page({
  data: {
    auditStatus: "",
    statusText: "未申请",
    merchant: null,
    hasMerchant: false,
    canApply: true,
    canEnterProfile: false,
    loading: true,
  },

  onShow() {
    this.loadStatus();
  },

  async loadStatus() {
    this.setData({ loading: true });
    try {
      const data = await merchantService.getMerchantAuditStatus();
      const auditStatus = data.audit_status || "not_applied";
      const merchant = data.merchant || null;
      this.setData({
        auditStatus,
        statusText: STATUS_TEXT[auditStatus] || auditStatus,
        merchant,
        hasMerchant: Boolean(merchant),
        canApply: auditStatus === "not_applied" || auditStatus === "rejected",
        canEnterProfile: auditStatus === "approved",
      });
    } catch (error) {
      showError(error.message || "商家状态加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goApply() {
    wx.navigateTo({ url: "/pages/merchant/apply/apply" });
  },

  goProfile() {
    wx.navigateTo({ url: "/pages/merchant/profile/profile" });
  },
});
