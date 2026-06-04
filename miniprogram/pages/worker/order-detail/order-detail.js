const orderService = require("../../../services/order.service");
const reviewService = require("../../../services/review.service");
const {
  formatOrderStatus,
  formatPayStatus,
  formatPrice,
} = require("../../../utils/format");
const { getStatusView } = require("../../../utils/status-view");
const {
  hideLoading,
  showError,
  showLoading,
  showSuccess,
} = require("../../../utils/toast");

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function maskPhone(phone) {
  const text = `${phone || ""}`;
  if (text.length < 7) return text || "手机号待确认";
  return `${text.slice(0, 3)}****${text.slice(-4)}`;
}

function formatDistance(order = {}) {
  const distance = Number(
    (order.lbs_match && order.lbs_match.distance_km) ||
      order.distance_km ||
      order.distanceKm,
  );
  if (!Number.isFinite(distance) || distance <= 0) return "距离待确认";
  return `${distance.toFixed(1)}km`;
}

function getNextStepText(status) {
  const stepMap = {
    accepted: "可按约定时间上门，确认后点击开始服务",
    serving: "服务中，完成后填写完工说明并提交",
    pending_review: "已提交验收，等待用户评价",
    completed: "订单已完成，可查看用户评价",
    canceled: "订单已取消，无需继续处理",
  };
  return stepMap[status] || "请按订单状态继续处理";
}

function buildTimeText(order = {}) {
  return firstPresent(
    order.started_at && `开始：${order.started_at}`,
    order.accepted_at && `接单：${order.accepted_at}`,
    order.created_at && `创建：${order.created_at}`,
    order.appointment_time && `预约：${order.appointment_time}`,
    "时间待确认",
  );
}

function buildAmountRows(order = {}) {
  const rows = [
    {
      label: "订单金额",
      value: formatPrice(firstPresent(order.pay_amount, order.payable_amount, order.price)),
      highlight: true,
    },
  ];

  if (order.discount_amount !== undefined && order.discount_amount !== null) {
    rows.push({
      label: "优惠信息",
      value: formatPrice(order.discount_amount),
      highlight: false,
    });
  }

  if (order.worker_earning_amount !== undefined && order.worker_earning_amount !== null) {
    rows.push({
      label: "师傅预计收入",
      value: formatPrice(order.worker_earning_amount),
      highlight: true,
    });
  }

  return rows;
}

function normalizeOrderForDetail(order = {}) {
  const statusView = getStatusView("order", order.status);
  const payStatusView = getStatusView("pay", order.pay_status);
  return {
    ...order,
    serviceName: order.service_name || order.serviceName || "服务订单",
    categoryText: order.category_name || order.service_category || "分类待确认",
    appointmentText: order.appointment_time || order.appointmentTime || "服务时间待确认",
    orderNoText: order.order_no || order.orderNo || "订单编号待生成",
    contactName: order.contact_name || "用户",
    maskedPhone: maskPhone(order.contact_phone),
    addressText:
      order.full_address ||
      order.address ||
      order.community ||
      "服务地址待确认",
    distanceText: formatDistance(order),
    statusView,
    payStatusView,
    nextStepText: getNextStepText(order.status),
    timeText: buildTimeText(order),
    amountRows: buildAmountRows(order),
  };
}

Page({
  data: {
    title: "师傅订单详情",
    orderId: "",
    order: null,
    review: null,
    priceText: "¥0.00",
    statusText: "",
    payStatusText: "",
    canStart: false,
    canFinish: false,
    finishRemark: "",
    finishImages: [],
    loading: true,
    errorText: "",
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
      this.setData({ loading: false, errorText: "缺少订单 ID" });
      showError("缺少订单 ID");
      return;
    }

    this.setData({ loading: true, errorText: "" });
    try {
      const data = await orderService.getOrderDetail({
        orderId: this.data.orderId,
      });
      const order = data.order;
      this.applyOrder(order);
      await this.loadOrderReview(order);
    } catch (error) {
      this.setData({
        order: null,
        review: null,
        errorText: error.message || "订单详情加载失败",
      });
      showError(error.message || "订单详情加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  async startService() {
    this.setData({ submitting: true });
    showLoading("开始服务");
    try {
      const data = await orderService.startService({
        orderId: this.data.orderId,
      });
      this.applyOrder(data.order);
      showSuccess("已开始服务");
    } catch (error) {
      showError(error.message || "操作失败");
    } finally {
      hideLoading();
      this.setData({ submitting: false });
    }
  },

  async finishService() {
    if (!this.data.finishRemark.trim()) {
      showError("请填写完工说明");
      return;
    }

    this.setData({ submitting: true });
    showLoading("完成服务");
    try {
      const data = await orderService.finishService({
        orderId: this.data.orderId,
        finishRemark: this.data.finishRemark,
        finishImages: this.data.finishImages,
      });
      this.applyOrder(data.order);
      showSuccess("已提交验收");
    } catch (error) {
      showError(error.message || "操作失败");
    } finally {
      hideLoading();
      this.setData({ submitting: false });
    }
  },

  applyOrder(order) {
    const sourceOrder = order || {};
    const normalizedOrder = normalizeOrderForDetail(sourceOrder);
    this.setData({
      order: normalizedOrder,
      priceText: formatPrice(
        firstPresent(sourceOrder.pay_amount, sourceOrder.payable_amount, sourceOrder.price),
      ),
      statusText: formatOrderStatus(sourceOrder.status),
      payStatusText: formatPayStatus(sourceOrder.pay_status),
      canStart: sourceOrder.status === "accepted",
      canFinish: sourceOrder.status === "serving",
      review: null,
    });
  },

  async loadOrderReview(order) {
    if (!order || !["pending_review", "completed"].includes(order.status)) {
      this.setData({ review: null });
      return;
    }

    try {
      const data = await reviewService.getOrderReview({
        orderId: this.data.orderId,
      });
      this.setData({ review: data.review || null });
    } catch (error) {
      this.setData({ review: null });
    }
  },

  handleFinishRemarkInput(event) {
    this.setData({
      finishRemark: event.detail.value,
    });
  },

  chooseFinishImages() {
    const remaining = 3 - this.data.finishImages.length;
    if (remaining <= 0) {
      showError("完工图片最多 3 张");
      return;
    }

    wx.chooseMedia({
      count: remaining,
      mediaType: ["image"],
      sourceType: ["album", "camera"],
      success: async (res) => {
        const tempFiles = res.tempFiles || [];
        const uploaded = [];
        for (const file of tempFiles) {
          const tempFilePath = file.tempFilePath;
          const cloudPath = `finish-images/${this.data.orderId}-${Date.now()}-${uploaded.length}.jpg`;
          const uploadResult = await wx.cloud.uploadFile({
            cloudPath,
            filePath: tempFilePath,
          });
          uploaded.push(uploadResult.fileID);
        }
        this.setData({
          finishImages: this.data.finishImages.concat(uploaded).slice(0, 3),
        });
      },
      fail: () => {},
    });
  },

  removeFinishImage(event) {
    const index = Number(event.currentTarget.dataset.index);
    const finishImages = this.data.finishImages.filter(
      (item, itemIndex) => itemIndex !== index,
    );
    this.setData({ finishImages });
  },
});
