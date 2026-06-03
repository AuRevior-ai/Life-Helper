const merchantService = require("../../../services/merchant.service");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

Page({
  data: {
    merchantId: "",
    merchant: {},
    services: [],
  },

  onLoad(options = {}) {
    this.setData({ merchantId: options.merchantId || "" });
    this.loadDetail();
  },

  async loadDetail() {
    try {
      const data = await merchantService.getStoreDetail({
        merchantId: this.data.merchantId,
      });
      const services = (data.services || []).map((item) => ({
        ...item,
        priceText: formatPrice(item.price).replace("¥", ""),
      }));
      this.setData({ merchant: data.merchant || {}, services });
    } catch (error) {
      showError(error.message || "商家详情加载失败");
    }
  },

  goOrder(event) {
    const merchantServiceId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/order-submit/order-submit?merchantServiceId=${merchantServiceId}`,
    });
  },
});
