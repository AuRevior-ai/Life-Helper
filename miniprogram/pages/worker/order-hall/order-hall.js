const orderService = require("../../../services/order.service");
const workerService = require("../../../services/worker.service");
const { WORKER_ONLINE_STATUS_TEXT } = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const {
  hideLoading,
  showError,
  showLoading,
  showSuccess,
} = require("../../../utils/toast");

Page({
  data: {
    title: "接单大厅",
    orders: [],
    online_status: "available",
    onlineStatusText: "可接单",
    loading: true,
    submittingId: "",
  },

  onShow() {
    this.loadOrderHall();
  },

  onPullDownRefresh() {
    this.loadOrderHall().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadOrderHall() {
    this.setData({ loading: true });
    try {
      const [workerData, data] = await Promise.all([
        workerService.getWorkerInfo(),
        workerService.getOrderHallList(),
      ]);
      const onlineStatus =
        (workerData.worker && workerData.worker.online_status) || "available";
      this.setData({
        online_status: onlineStatus,
        onlineStatusText:
          WORKER_ONLINE_STATUS_TEXT[onlineStatus] || onlineStatus,
        orders: (data.orders || []).map((order) => ({
          ...order,
          priceText: formatPrice(order.price),
        })),
      });
    } catch (error) {
      showError(error.message || "接单大厅加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  async acceptOrder(event) {
    const orderId = event.currentTarget.dataset.id;
    this.setData({ submittingId: orderId });
    showLoading("接单中");
    try {
      const data = await orderService.acceptOrder({ orderId });
      const acceptedOrderId =
        data && data.order && data.order._id ? data.order._id : orderId;
      showSuccess("接单成功");
      wx.redirectTo({
        url: `/pages/worker/order-detail/order-detail?orderId=${acceptedOrderId}`,
      });
    } catch (error) {
      showError(error.message || "接单失败");
    } finally {
      hideLoading();
      this.setData({ submittingId: "" });
    }
  },

  goWorkerOrders() {
    wx.navigateTo({
      url: "/pages/worker/order-list/order-list",
    });
  },
});
