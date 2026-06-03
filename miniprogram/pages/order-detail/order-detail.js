const orderService = require("../../services/order.service");
const paymentService = require("../../services/payment.service");
const reviewService = require("../../services/review.service");
const { isWechatPayMode } = require("../../config/payment");
const {
  AFTER_SALE_STATUS_TEXT,
  REFUND_STATUS_TEXT,
} = require("../../config/status");
const {
  formatOrderStatus,
  formatPayStatus,
  formatPrice,
} = require("../../utils/format");
const {
  hideLoading,
  showError,
  showLoading,
  showSuccess,
} = require("../../utils/toast");

Page({
  data: {
    title: "订单详情",
    orderId: "",
    order: null,
    priceText: "¥0.00",
    originalAmountText: "¥0.00",
    memberDiscountText: "-¥0.00",
    couponDiscountText: "-¥0.00",
    payableAmountText: "¥0.00",
    statusText: "",
    payStatusText: "",
    afterSaleStatusText: "",
    refundStatusText: "",
    canPay: false,
    canCancel: false,
    canReview: false,
    canViewReview: false,
    reviewId: "",
    canTip: false,
    canApplyAfterSale: false,
    canViewAfterSale: false,
    loading: true,
    submitting: false,
  },

  onLoad(options = {}) {
    this.setData({
      orderId: options.orderId || "",
    });
    this.loadOrderDetail();
  },

  async loadOrderDetail() {
    if (!this.data.orderId) {
      this.setData({ loading: false });
      showError("缺少订单 ID");
      return;
    }

    this.setData({ loading: true });
    try {
      const data = await orderService.getOrderDetail({
        orderId: this.data.orderId,
      });
      this.applyOrder(data.order);
      await this.loadOrderReview(data.order);
    } catch (error) {
      showError(error.message || "订单加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  applyOrder(order) {
    this.setData({
      order,
      priceText: formatPrice(order.pay_amount || order.price),
      originalAmountText: formatPrice(order.original_amount || order.price),
      memberDiscountText: `-${formatPrice(order.member_discount_amount || 0)}`,
      couponDiscountText: `-${formatPrice(order.coupon_discount_amount || 0)}`,
      payableAmountText: formatPrice(
        order.payable_amount || order.pay_amount || order.price,
      ),
      statusText: formatOrderStatus(order.status),
      payStatusText: formatPayStatus(order.pay_status),
      afterSaleStatusText:
        AFTER_SALE_STATUS_TEXT[order.after_sale_status || "none"] || "无售后",
      refundStatusText:
        REFUND_STATUS_TEXT[order.refund_status || "none"] || "未退款",
      canPay: order.status === "pending_pay" && order.pay_status === "unpaid",
      canCancel: ["pending_pay", "pending_accept"].includes(order.status),
      canReview: order.status === "pending_review",
      canViewReview: false,
      reviewId: "",
      canTip:
        order.status === "completed" &&
        order.pay_status === "paid" &&
        order.worker_id &&
        (!order.refund_status || order.refund_status === "none") &&
        (!order.after_sale_status || order.after_sale_status === "none"),
      canApplyAfterSale:
        [
          "pending_accept",
          "accepted",
          "serving",
          "pending_review",
          "completed",
        ].includes(order.status) &&
        order.pay_status === "paid" &&
        (!order.after_sale_status || order.after_sale_status === "none"),
      canViewAfterSale: Boolean(order.after_sale_id),
    });
  },

  async loadOrderReview(order) {
    if (!order || order.status !== "completed") {
      return;
    }

    try {
      const data = await reviewService.getOrderReview({
        orderId: this.data.orderId,
      });
      const review = data.review;
      if (review && review._id) {
        this.setData({
          canViewReview: true,
          reviewId: review._id,
        });
      }
    } catch (error) {
      this.setData({
        canViewReview: false,
        reviewId: "",
      });
    }
  },

  async handlePay() {
    if (isWechatPayMode()) {
      await this.handleWechatPay();
      return;
    }

    await this.handleMockPay();
  },

  async handleMockPay() {
    this.setData({ submitting: true });
    showLoading("支付中");
    try {
      const data = await orderService.mockPayOrder({
        orderId: this.data.orderId,
      });
      this.applyOrder(data.order);
      showSuccess("模拟支付成功");
    } catch (error) {
      showError(error.message || "支付失败");
    } finally {
      hideLoading();
      this.setData({ submitting: false });
    }
  },

  requestPayment(payParams) {
    return new Promise((resolve, reject) => {
      wx.requestPayment({
        ...payParams,
        success: resolve,
        fail: reject,
      });
    });
  },

  async handleWechatPay() {
    this.setData({ submitting: true });
    showLoading("支付中");
    try {
      const data = await paymentService.createPayment({
        orderId: this.data.orderId,
      });
      await this.requestPayment(data.payParams);
      wx.redirectTo({
        url: `/pages/pay-result/pay-result?orderId=${this.data.orderId}`,
      });
    } catch (error) {
      showError(error.message || "支付失败");
    } finally {
      hideLoading();
      this.setData({ submitting: false });
    }
  },

  handleCancelOrder() {
    wx.showModal({
      title: "取消订单",
      content: "确认取消这个订单吗？",
      confirmColor: "#c66b2d",
      success: async (res) => {
        if (!res.confirm) return;
        this.setData({ submitting: true });
        try {
          const data = await orderService.cancelOrder({
            orderId: this.data.orderId,
          });
          this.applyOrder(data.order);
          showSuccess("订单已取消");
        } catch (error) {
          showError(error.message || "取消失败");
        } finally {
          this.setData({ submitting: false });
        }
      },
    });
  },

  goReview() {
    wx.navigateTo({
      url: `/pages/review/review?orderId=${this.data.orderId}`,
    });
  },

  goReviewDetail() {
    if (!this.data.reviewId) {
      showError("评价信息暂未生成，请稍后刷新");
      return;
    }
    wx.navigateTo({
      url: `/pages/review/detail/detail?reviewId=${this.data.reviewId}`,
    });
  },

  goTip() {
    wx.navigateTo({
      url: `/pages/tip/create/create?orderId=${this.data.orderId}`,
    });
  },

  goAfterSaleApply() {
    wx.navigateTo({
      url: `/pages/after-sale/apply/apply?orderId=${this.data.orderId}`,
    });
  },

  goAfterSaleDetail() {
    wx.navigateTo({
      url: `/pages/after-sale/detail/detail?afterSaleId=${this.data.order.after_sale_id}`,
    });
  },

  goWorkerDetail() {
    if (!this.data.order.worker_id) {
      return;
    }
    wx.navigateTo({
      url: `/pages/worker-detail/worker-detail?workerId=${this.data.order.worker_id}`,
    });
  },
});
