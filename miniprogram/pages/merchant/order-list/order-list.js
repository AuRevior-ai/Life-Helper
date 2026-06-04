const merchantService = require("../../../services/merchant.service");
const { showError } = require("../../../utils/toast");
const { formatPrice, formatOrderStatus } = require("../../../utils/format");

function normalizeOrder(order = {}) {
  return {
    ...order,
    id: order._id || order.id || "",
    serviceName: order.service_name || order.serviceName || "未命名服务",
    statusText: formatOrderStatus(order.status || ""),
    amountText: formatPrice(order.final_amount || order.total_amount || 0),
    customerText: order.contact_name || order.user_name || "用户信息待完善",
  };
}

Page({
  data: {
    loading: true,
    orders: [],
    displayOrders: [],
  },

  onShow() {
    this.loadOrders();
  },

  async loadOrders() {
    this.setData({ loading: true });
    try {
      const data = await merchantService.getMerchantOrderList();
      const orders = data.list || [];
      this.setData({
        orders,
        displayOrders: orders.map(normalizeOrder),
      });
    } catch (error) {
      showError(error.message || "商家订单加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goDetail(event) {
    const orderId = event.currentTarget.dataset.id;
    if (!orderId) return;
    wx.navigateTo({
      url: `/pages/merchant/order-detail/order-detail?orderId=${orderId}`,
    });
  },
});
