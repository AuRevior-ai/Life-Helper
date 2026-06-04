const merchantService = require("../../../services/merchant.service");
const { showError, showSuccess } = require("../../../utils/toast");
const {
  buildFullAddress,
  formatOrderStatus,
  formatPayStatus,
  formatPrice,
} = require("../../../utils/format");

function compactText(parts) {
  return parts.map((item) => `${item || ""}`.trim()).filter(Boolean).join(" ");
}

function normalizeOrder(order = {}) {
  const address = order.address_snapshot || order.address || order;
  const addressText =
    buildFullAddress(address) ||
    compactText([
      order.city,
      order.district,
      order.community,
      order.detail_address || order.detailAddress,
    ]) ||
    "地址信息待完善";
  const amount =
    order.final_amount || order.total_amount || order.pay_amount || order.price || 0;

  return {
    ...order,
    id: order._id || order.id || "",
    orderNo: order.order_no || order.orderNo || order._id || "订单编号待生成",
    serviceName: order.service_name || order.serviceName || "未命名服务",
    statusText: formatOrderStatus(order.status || ""),
    payStatusText: formatPayStatus(order.pay_status || ""),
    amountText: formatPrice(amount),
    customerText:
      order.contact_name || order.user_name || order.customer_name || "客户信息待完善",
    phoneText: order.contact_phone || order.user_phone || "电话待完善",
    addressText,
    appointmentText:
      compactText([
        order.appointment_date || order.appointmentDate,
        order.appointment_time_slot || order.appointmentTimeSlot,
      ]) || "预约时间待完善",
    remarkText: order.remark || order.user_remark || "暂无备注",
  };
}

Page({
  data: {
    orderId: "",
    order: normalizeOrder(),
    finishRemark: "",
    loading: true,
    errorText: "",
    actionLoading: "",
  },
  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || "" });
    this.loadOrder();
  },

  async loadOrder() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await merchantService.getMerchantOrderDetail({
        orderId: this.data.orderId,
      });
      this.setData({ order: normalizeOrder(data.order || {}) });
    } catch (error) {
      this.setData({ errorText: error.message || "订单加载失败" });
      showError(error.message || "订单加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  onRemarkInput(event) {
    this.setData({ finishRemark: event.detail.value });
  },

  async accept() {
    if (this.data.actionLoading) return;
    this.setData({ actionLoading: "accept" });
    try {
      await merchantService.merchantAcceptOrder({ orderId: this.data.orderId });
      showSuccess("商家接单成功");
      await this.loadOrder();
    } catch (error) {
      showError(error.message || "操作失败");
    } finally {
      this.setData({ actionLoading: "" });
    }
  },

  async start() {
    if (this.data.actionLoading) return;
    this.setData({ actionLoading: "start" });
    try {
      await merchantService.merchantStartService({ orderId: this.data.orderId });
      showSuccess("商家服务已开始");
      await this.loadOrder();
    } catch (error) {
      showError(error.message || "操作失败");
    } finally {
      this.setData({ actionLoading: "" });
    }
  },

  async finish() {
    if (this.data.actionLoading) return;
    this.setData({ actionLoading: "finish" });
    try {
      await merchantService.merchantFinishService({
        orderId: this.data.orderId,
        finishRemark: this.data.finishRemark,
      });
      showSuccess("商家完工已提交");
      await this.loadOrder();
    } catch (error) {
      showError(error.message || "操作失败");
    } finally {
      this.setData({ actionLoading: "" });
    }
  },

  goBack() {
    wx.navigateBack();
  },
});
