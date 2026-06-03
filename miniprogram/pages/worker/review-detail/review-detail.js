const reviewService = require("../../../services/review.service");
const {
  hideLoading,
  showError,
  showLoading,
  showSuccess,
} = require("../../../utils/toast");

Page({
  data: {
    title: "评价详情",
    reviewId: "",
    review: null,
    replyContent: "",
    appealReason: "",
    submitting: false,
  },
  onLoad(options = {}) {
    this.setData({ reviewId: options.reviewId || "" });
    this.loadReview();
  },

  async loadReview() {
    try {
      const data = await reviewService.getReviewDetail({
        reviewId: this.data.reviewId,
      });
      this.setData({ review: data.review });
    } catch (error) {
      showError(error.message || "评价加载失败");
    }
  },

  onReplyInput(event) {
    this.setData({ replyContent: event.detail.value });
  },

  onAppealInput(event) {
    this.setData({ appealReason: event.detail.value });
  },

  async submitReply() {
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
});
