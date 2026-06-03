const adminService = require("../../../services/admin.service");
const dispatchService = require("../../../services/dispatch.service");
const { ORDER_STATUS, ORDER_STATUS_TEXT } = require("../../../config/status");
const { formatOrderStatus, formatPrice } = require("../../../utils/format");
const { showError, showSuccess } = require("../../../utils/toast");

const STATUS_OPTIONS = Object.values(ORDER_STATUS).map((status) => ({
  value: status,
  label: ORDER_STATUS_TEXT[status] || status,
}));

function mapOrder(order = {}) {
  return {
    ...order,
    statusText: formatOrderStatus(order.status),
    priceText: formatPrice(order.price),
  };
}

Page({
  data: {
    title: "管理订单详情",
    orderId: "",
    order: {},
    statusOptions: STATUS_OPTIONS,
    statusLabels: STATUS_OPTIONS.map((item) => item.label),
    selectedStatusIndex: 0,
    selectedStatusText: STATUS_OPTIONS[0].label,
    loading: true,
    submitting: false,
  },

  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || "" });
    this.loadOrder();
  },

  async loadOrder() {
    if (!this.data.orderId) {
      showError("缺少订单 ID");
      return;
    }

    this.setData({ loading: true });
    try {
      const data = await adminService.getOrderDetail({
        orderId: this.data.orderId,
      });
      const order = mapOrder(data.order || {});
      const selectedStatusIndex = Math.max(
        STATUS_OPTIONS.findIndex((item) => item.value === order.status),
        0,
      );
      this.setData({
        order,
        selectedStatusIndex,
        selectedStatusText: STATUS_OPTIONS[selectedStatusIndex].label,
      });
    } catch (error) {
      showError(error.message || "订单详情加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  onStatusChange(event) {
    const selectedStatusIndex = Number(event.detail.value || 0);
    this.setData({
      selectedStatusIndex,
      selectedStatusText: STATUS_OPTIONS[selectedStatusIndex].label,
    });
  },

  async submitStatus() {
    const status = STATUS_OPTIONS[this.data.selectedStatusIndex].value;
    this.setData({ submitting: true });
    try {
      const data = await adminService.adminUpdateOrderStatus({
        orderId: this.data.orderId,
        status,
      });
      this.setData({
        order: mapOrder(data.order || {}),
      });
      showSuccess("订单状态已更新");
    } catch (error) {
      showError(error.message || "状态更新失败");
    } finally {
      this.setData({ submitting: false });
    }
  },

  goAssignWorker() {
    wx.navigateTo({
      url: `/pages/admin/assign-worker/assign-worker?orderId=${this.data.orderId}`,
    });
  },

  goDispatchLogs() {
    wx.navigateTo({
      url: `/pages/admin/dispatch-logs/dispatch-logs?orderId=${this.data.orderId}`,
    });
  },

  async unassignOrder() {
    this.setData({ submitting: true });
    try {
      const data = await dispatchService.adminUnassignOrder({
        orderId: this.data.orderId,
        reason: "管理员取消指派并回流接单大厅",
      });
      this.setData({ order: mapOrder(data.order || {}) });
      showSuccess("订单已回流接单大厅");
    } catch (error) {
      showError(error.message || "回流失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
