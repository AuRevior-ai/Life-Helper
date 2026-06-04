const reviewService = require("../../../services/review.service");
const {
  hideLoading,
  showError,
  showLoading,
  showSuccess,
} = require("../../../utils/toast");

function normalizeReviewDetail(review = {}) {
  const rating = Number(review.rating || 0);
  return {
    ...review,
    serviceName: review.service_name || "服务订单",
    ratingText: Number.isFinite(rating) && rating > 0 ? `${rating} 分` : "未评分",
    userName: review.is_anonymous ? "匿名用户" : review.user_nickname || "用户",
    timeText: review.created_at || review.reviewed_at || review.updated_at || "时间待确认",
    contentText: review.content || "用户暂未填写文字评价",
    followupText: review.followup_content || "暂无追评",
    replyText: review.worker_reply_content || "暂无回复",
    appealStatusText: review.appeal_status || "none",
    orderId: review.order_id || "",
  };
}

Page({
  data: {
    title: "评价详情",
    reviewId: "",
    review: null,
    replyContent: "",
    appealReason: "",
    loading: true,
    errorText: "",
    submitting: false,
  },

  onLoad(options = {}) {
    this.setData({ reviewId: options.reviewId || "" });
    this.loadReview();
  },

  async loadReview() {
    if (!this.data.reviewId) {
      this.setData({
        loading: false,
        errorText: "缺少评价 ID",
      });
      showError("缺少评价 ID");
      return;
    }

    this.setData({ loading: true, errorText: "" });
    try {
      const data = await reviewService.getReviewDetail({
        reviewId: this.data.reviewId,
      });
      this.setData({ review: normalizeReviewDetail(data.review || {}) });
    } catch (error) {
      this.setData({
        review: null,
        errorText: error.message || "评价加载失败",
      });
      showError(error.message || "评价加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  onReplyInput(event) {
    this.setData({ replyContent: event.detail.value });
  },

  onAppealInput(event) {
    this.setData({ appealReason: event.detail.value });
  },

  async submitReply() {
    if (!`${this.data.replyContent || ""}`.trim()) {
      showError("请填写回复内容");
      return;
    }

    this.setData({ submitting: true });
    showLoading("提交中");
    try {
      await reviewService.workerReplyReview({
        reviewId: this.data.reviewId,
        content: this.data.replyContent,
      });
      hideLoading();
      showSuccess("回复提交成功");
      await this.loadReview();
    } catch (error) {
      hideLoading();
      showError(error.message || "回复失败");
    } finally {
      this.setData({ submitting: false });
    }
  },

  async submitAppeal() {
    if (!`${this.data.appealReason || ""}`.trim()) {
      showError("请填写申诉理由");
      return;
    }

    this.setData({ submitting: true });
    showLoading("提交中");
    try {
      await reviewService.workerCreateReviewAppeal({
        reviewId: this.data.reviewId,
        reason: this.data.appealReason,
      });
      hideLoading();
      showSuccess("申诉提交成功");
      await this.loadReview();
    } catch (error) {
      hideLoading();
      showError(error.message || "申诉失败");
    } finally {
      this.setData({ submitting: false });
    }
  },

  goOrderDetail() {
    const orderId = this.data.review && this.data.review.orderId;
    if (!orderId) {
      showError("缺少订单 ID");
      return;
    }
    wx.navigateTo({
      url: `/pages/worker/order-detail/order-detail?orderId=${orderId}`,
    });
  },
});
