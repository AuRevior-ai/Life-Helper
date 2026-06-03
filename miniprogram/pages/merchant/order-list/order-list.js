const merchantService = require("../../../services/merchant.service");
const { showError } = require("../../../utils/toast");

Page({
  data: { orders: [] },
  onLoad() {
    this.loadOrders();
  },

  async loadOrders() {
    try {
      const data = await merchantService.getMerchantOrderList();
      this.setData({ orders: data.list || [] });
    } catch (error) {
      showError(error.message || "商家订单加载失败");
    }
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/merchant/order-detail/order-detail?orderId=${event.currentTarget.dataset.id}`,
    });
  },
});
