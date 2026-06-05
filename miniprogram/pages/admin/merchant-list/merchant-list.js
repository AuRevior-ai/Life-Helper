const merchantService = require("../../../services/merchant.service");
const { showError } = require("../../../utils/toast");

function mapMerchant(merchant = {}) {
  return {
    ...merchant,
    storeName: merchant.store_name || merchant.name || "未命名商家",
    auditText: merchant.audit_status || "未提交审核",
    statusText: merchant.status || "未记录经营状态",
    contactText: merchant.contact_phone || merchant.phone || "未填写联系方式",
  };
}

Page({
  data: {
    title: "商家管理",
    merchants: [],
    loading: true,
    errorText: "",
    filterPills: ["全部商家", "审核状态", "经营状态", "后端为准"],
  },
  onLoad() {
    this.loadMerchants();
  },

  async loadMerchants() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await merchantService.adminGetMerchantList();
      this.setData({ merchants: (data.list || []).map(mapMerchant) });
    } catch (error) {
      const errorText = error.message || "商家列表加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/admin/merchant-detail/merchant-detail?merchantId=${event.currentTarget.dataset.id}`,
    });
  },
});
