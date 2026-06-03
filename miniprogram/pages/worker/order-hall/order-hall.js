const orderService = require("../../../services/order.service");
const workerService = require("../../../services/worker.service");
const { WORKER_ONLINE_STATUS } = require("../../../config/status");
const {
  hideLoading,
  showError,
  showLoading,
  showSuccess,
} = require("../../../utils/toast");

function formatHallPrice(value) {
  const cents = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `¥${Math.round(cents / 100)}`;
}

function maskPhone(phone) {
  const text = `${phone || ""}`;
  if (text.length < 7) return text || "手机号待确认";
  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function formatDistance(order) {
  const distance = Number(
    (order.lbs_match && order.lbs_match.distance_km) ||
      order.distance_km ||
      order.distanceKm,
  );
  if (!Number.isFinite(distance) || distance <= 0) {
    return "距离待确认";
  }
  return `${distance.toFixed(1)}km`;
}

function normalizeOrder(order) {
  return {
    ...order,
    serviceName:
      order.service_name || order.serviceName || order.category_name || "服务订单",
    appointmentText:
      order.appointment_time || order.appointmentTime || "上门时间待确认",
    addressText:
      order.full_address ||
      order.address ||
      order.community ||
      "服务地址待确认",
    contactText: `${order.contact_name || "用户"} ${maskPhone(order.contact_phone)}`,
    distanceText: formatDistance(order),
    priceText: formatHallPrice(order.price),
  };
}

function getServiceRadiusText(worker = {}) {
  const radius = Number(worker.service_radius_km || worker.serviceRadiusKm || 3);
  if (!Number.isFinite(radius) || radius <= 0) return "3";
  return String(Math.round(radius * 10) / 10);
}

Page({
  data: {
    title: "接单大厅",
    orders: [],
    online_status: WORKER_ONLINE_STATUS.AVAILABLE,
    onlineStatusText: "在线接单",
    isOnline: true,
    loading: true,
    submittingId: "",
    availableCountText: "0",
    serviceRadiusText: "3",
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
      const worker = workerData.worker || {};
      const onlineStatus = worker.online_status || WORKER_ONLINE_STATUS.AVAILABLE;
      const isOnline = onlineStatus !== WORKER_ONLINE_STATUS.PAUSED;
      const orders = (data.orders || []).map(normalizeOrder);
      this.setData({
        online_status: onlineStatus,
        onlineStatusText: isOnline ? "在线接单" : "暂停接单",
        isOnline,
        orders,
        availableCountText: String(orders.length),
        serviceRadiusText: getServiceRadiusText(worker),
      });
    } catch (error) {
      showError(error.message || "接单大厅加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  async onOnlineSwitchChange(event) {
    const isOnline = Boolean(event.detail.value);
    const onlineStatus = isOnline
      ? WORKER_ONLINE_STATUS.AVAILABLE
      : WORKER_ONLINE_STATUS.PAUSED;
    try {
      await workerService.updateWorkerOnlineStatus({
        online_status: onlineStatus,
      });
      this.setData({
        online_status: onlineStatus,
        onlineStatusText: isOnline ? "在线接单" : "暂停接单",
        isOnline,
      });
      showSuccess("接单状态已更新");
      this.loadOrderHall();
    } catch (error) {
      this.setData({ isOnline: !isOnline });
      showError(error.message || "状态更新失败");
    }
  },

  onFilterTap() {},

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
    wx.redirectTo({
      url: "/pages/worker/order-list/order-list",
    });
  },
});
