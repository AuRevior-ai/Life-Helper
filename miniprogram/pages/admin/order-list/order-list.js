const adminService = require("../../../services/admin.service");
const { ORDER_STATUS } = require("../../../config/status");
const { formatOrderStatus, formatPrice } = require("../../../utils/format");
const { showError, showToast } = require("../../../utils/toast");

const STATUS_TABS = Object.freeze([
  { key: "all", label: "全部", status: "" },
  { key: "pending", label: "待接单", status: ORDER_STATUS.PENDING_ACCEPT },
  { key: "serving", label: "服务中", status: ORDER_STATUS.SERVING },
  { key: "afterSale", label: "售后中", status: "" },
]);

function maskPhone(phone) {
  const value = `${phone || ""}`.trim();
  if (value.length < 7) return value || "手机号待补充";
  return `${value.slice(0, 3)}****${value.slice(-4)}`;
}

function getShortAddress(order = {}) {
  const address = order.address || {};
  return (
    order.address_text ||
    order.addressText ||
    address.detail_address ||
    address.detailAddress ||
    address.community ||
    "服务地址待补充"
  );
}

function hasAfterSale(order = {}) {
  const status = order.after_sale_status || order.afterSaleStatus || "";
  return Boolean(status && status !== "none");
}

function getStatusTone(order = {}) {
  if (hasAfterSale(order)) return "order-status-badge--blue";
  if (order.status === ORDER_STATUS.SERVING) return "order-status-badge--orange";
  return "order-status-badge--green";
}

function getVisualTone(order = {}) {
  if (hasAfterSale(order)) return "admin-tone-orange";
  if (order.status === ORDER_STATUS.SERVING) return "admin-tone-orange";
  return "admin-tone-green";
}

function normalizeOrder(order = {}) {
  return {
    ...order,
    id: order._id || order.orderId || "",
    serviceName: order.service_name || order.serviceName || "社区便民服务",
    contactName: order.contact_name || order.contactName || "用户",
    maskedPhone: maskPhone(order.contact_phone || order.contactPhone),
    shortAddress: getShortAddress(order),
    amountText: formatPrice(order.price || order.amount || 0),
    statusText: hasAfterSale(order) ? "售后中" : formatOrderStatus(order.status),
    statusTone: getStatusTone(order),
    visualTone: getVisualTone(order),
    visualText: hasAfterSale(order) ? "售" : "服",
    isAfterSale: hasAfterSale(order),
  };
}

function buildKpis(orders = [], stats = {}) {
  const counts = stats.status_counts || stats.statusCounts || {};
  const countByStatus = (status) =>
    Number(counts[status] || orders.filter((order) => order.status === status).length);
  return {
    pendingAccept: countByStatus(ORDER_STATUS.PENDING_ACCEPT),
    serving: countByStatus(ORDER_STATUS.SERVING),
    afterSale: orders.filter(hasAfterSale).length,
  };
}

Page({
  data: {
    loading: true,
    activeStatus: "all",
    orders: [],
    displayOrders: [],
    kpis: {
      pendingAccept: 0,
      serving: 0,
      afterSale: 0,
    },
    page: 1,
    pageSize: 20,
    hasMore: false,
  },

  onShow() {
    this.loadOrders(true);
  },

  onPullDownRefresh() {
    this.loadOrders(true).finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadOrders(false);
    }
  },

  onStatusTabTap(event) {
    const key = event.currentTarget.dataset.key;
    if (!key || key === this.data.activeStatus) return;
    this.setData({ activeStatus: key });
    this.loadOrders(true);
  },

  onFilterTap() {
    showToast("筛选项沿用现有订单列表能力，后续可继续细化");
  },

  async loadOrders(reset = true) {
    const page = reset ? 1 : this.data.page + 1;
    const tab = STATUS_TABS.find((item) => item.key === this.data.activeStatus);
    const status = tab ? tab.status : "";
    this.setData({ loading: true });
    try {
      const [listData, statsData] = await Promise.all([
        adminService.getAllOrders({
          status,
          page,
          pageSize: this.data.pageSize,
        }),
        adminService.getOrderStats().catch(() => ({})),
      ]);
      const rawList = listData.list || listData.orders || [];
      const normalized = rawList.map(normalizeOrder);
      const nextOrders = reset ? normalized : this.data.orders.concat(normalized);
      const displayOrders =
        this.data.activeStatus === "afterSale"
          ? nextOrders.filter((order) => order.isAfterSale)
          : nextOrders;
      this.setData({
        orders: nextOrders,
        displayOrders,
        kpis: buildKpis(nextOrders, statsData),
        page: listData.page || page,
        hasMore: !!listData.hasMore,
      });
    } catch (error) {
      showError(error.message || "订单加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goDetail(event) {
    const orderId = event.currentTarget.dataset.id;
    if (!orderId) return;
    wx.navigateTo({
      url: `/pages/admin/order-detail/order-detail?orderId=${orderId}`,
    });
  },

  goAssignWorker(event) {
    const orderId = event.currentTarget.dataset.id;
    if (!orderId) return;
    wx.navigateTo({
      url: `/pages/admin/assign-worker/assign-worker?orderId=${orderId}`,
    });
  },

  goAfterSaleList() {
    wx.navigateTo({
      url: "/pages/admin/after-sale-list/after-sale-list",
    });
  },

  goDispatchLogs() {
    wx.navigateTo({
      url: "/pages/admin/dispatch-logs/dispatch-logs",
    });
  },

  goFinanceList() {
    wx.navigateTo({
      url: "/pages/admin/finance-log-list/finance-log-list",
    });
  },
});
