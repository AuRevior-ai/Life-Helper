const merchantService = require("../../../services/merchant.service");
const { showError } = require("../../../utils/toast");

function normalizeMerchant(merchant = {}) {
  const status = merchant.audit_status || merchant.status || "待完善";
  return {
    ...merchant,
    storeName: merchant.store_name || "商家中心",
    contactText: merchant.contact_name || merchant.contact_phone || "资料待完善",
    statusText: status,
    serviceCountText: `${Number(merchant.service_count || 0)} 项`,
    orderCountText: `${Number(merchant.order_count || 0)} 单`,
  };
}

Page({
  data: {
    loading: true,
    merchant: normalizeMerchant(),
  },

  onShow() {
    this.loadMerchant();
  },

  async loadMerchant() {
    this.setData({ loading: true });
    try {
      const data = await merchantService.getMyMerchantInfo();
      this.setData({ merchant: normalizeMerchant(data.merchant || {}) });
    } catch (error) {
      showError(error.message || "商家信息加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goServices() {
    wx.navigateTo({ url: "/pages/merchant/service-list/service-list" });
  },
  goOrders() {
    wx.navigateTo({ url: "/pages/merchant/order-list/order-list" });
  },
  goIncome() {
    wx.navigateTo({ url: "/pages/merchant/income/income" });
  },
  goQualification() {
    wx.navigateTo({ url: "/pages/merchant/qualification/qualification" });
  },
  goDeposit() {
    wx.navigateTo({ url: "/pages/merchant/deposit/deposit" });
  },
  goRiskStatus() {
    wx.navigateTo({ url: "/pages/merchant/risk-status/risk-status" });
  },

  goAuditStatus() {
    wx.redirectTo({ url: "/pages/merchant/audit-status/audit-status" });
  },
});
