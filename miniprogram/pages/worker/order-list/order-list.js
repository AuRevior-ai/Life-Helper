const orderService = require("../../../services/order.service");
const { ORDER_STATUS, ORDER_STATUS_TEXT } = require("../../../config/status");
const { showError } = require("../../../utils/toast");

const STATUS_OPTIONS = [
  { value: "", label: "全部" },
  { value: ORDER_STATUS.ACCEPTED, label: "待上门" },
  { value: ORDER_STATUS.SERVING, label: "服务中" },
  { value: ORDER_STATUS.PENDING_REVIEW, label: "待完成" },
  { value: ORDER_STATUS.COMPLETED, label: "已完成" },
];

const WORKER_STATUS_TABS = STATUS_OPTIONS.map((item) => ({ ...item }));

const WORKER_ORDER_STATUS_TEXT = {
  [ORDER_STATUS.ACCEPTED]: "待上门",
  [ORDER_STATUS.SERVING]: "服务中",
  [ORDER_STATUS.PENDING_REVIEW]: "待完成",
  [ORDER_STATUS.COMPLETED]: "已完成",
};

const WORKER_ORDER_STATUS_TONE = {
  [ORDER_STATUS.ACCEPTED]: "green",
  [ORDER_STATUS.SERVING]: "blue",
  [ORDER_STATUS.PENDING_REVIEW]: "green",
  [ORDER_STATUS.COMPLETED]: "gray",
  [ORDER_STATUS.CANCELED]: "gray",
};

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function formatWorkerOrderPrice(value) {
  const cents = Number.isFinite(Number(value)) ? Number(value) : 0;
  return `¥${Math.round(cents / 100)}`;
}

function maskWorkerOrderPhone(phone) {
  const text = `${phone || ""}`;
  if (text.length < 7) return text || "手机号待确认";
  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function formatWorkerOrderDistance(order = {}) {
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

function getWorkerOrderActionText(status) {
  if (status === ORDER_STATUS.ACCEPTED) return "开始服务";
  if (status === ORDER_STATUS.SERVING) return "联系用户";
  if (status === ORDER_STATUS.COMPLETED) return "查看评价";
  return "";
}

function buildStatusTabs(selectedValue) {
  return WORKER_STATUS_TABS.map((item, index) => ({
    ...item,
    index,
    active: item.value === selectedValue,
  }));
}

function normalizeWorkerOrder(order = {}) {
  const status = order.status || "";
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
    contactText: `${order.contact_name || "用户"} ${maskWorkerOrderPhone(order.contact_phone)}`,
    distanceText: formatWorkerOrderDistance(order),
    priceText: formatWorkerOrderPrice(
      firstPresent(order.pay_amount, order.payable_amount, order.price),
    ),
    statusText:
      WORKER_ORDER_STATUS_TEXT[status] || ORDER_STATUS_TEXT[status] || "订单状态",
    statusTone: WORKER_ORDER_STATUS_TONE[status] || "gray",
    primaryActionText: getWorkerOrderActionText(status),
  };
}

Page({
  data: {
    title: "我的订单",
    orders: [],
    statusOptions: STATUS_OPTIONS,
    statusLabels: STATUS_OPTIONS.map((item) => item.label),
    statusTabs: buildStatusTabs(""),
    selectedStatusLabel: STATUS_OPTIONS[0].label,
    selectedStatusIndex: 0,
    timeRangeLabel: "本周",
    page: 1,
    pageSize: 20,
    hasMore: false,
    loading: true,
  },

  onShow() {
    this.loadWorkerOrders(true);
  },

  onPullDownRefresh() {
    this.loadWorkerOrders(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadWorkerOrders(false);
    }
  },

  onStatusChange(event) {
    this.updateSelectedStatus(Number(event.detail.value || 0));
    this.loadWorkerOrders(true);
  },

  onStatusTabTap(event) {
    this.updateSelectedStatus(Number(event.currentTarget.dataset.index || 0));
    this.loadWorkerOrders(true);
  },

  updateSelectedStatus(selectedStatusIndex) {
    const option = STATUS_OPTIONS[selectedStatusIndex] || STATUS_OPTIONS[0];
    this.setData({
      selectedStatusIndex,
      selectedStatusLabel: option.label,
      statusTabs: buildStatusTabs(option.value),
    });
  },

  onTimeRangeTap() {},

  async loadWorkerOrders(reset = true) {
    const page = reset ? 1 : this.data.page + 1;
    const status = STATUS_OPTIONS[this.data.selectedStatusIndex].value;
    this.setData({ loading: true });
    try {
      const data = await orderService.getWorkerOrderList({
        status,
        page,
        pageSize: this.data.pageSize,
      });
      const list = data.list || data.orders || [];
      const orders = list.map(normalizeWorkerOrder);
      this.setData({
        orders: reset ? orders : this.data.orders.concat(orders),
        page: data.page || page,
        hasMore: !!data.hasMore,
      });
    } catch (error) {
      showError(error.message || "师傅订单加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goOrderDetail(event) {
    const order = event.detail || {};
    const orderId = event.currentTarget.dataset.id || order._id;
    wx.navigateTo({
      url: `/pages/worker/order-detail/order-detail?orderId=${orderId}`,
    });
  },

  onPrimaryActionTap(event) {
    this.goOrderDetail(event);
  },

  goOrderHall() {
    wx.redirectTo({
      url: "/pages/worker/order-hall/order-hall",
    });
  },
});
