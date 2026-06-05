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
    reason: "",
    loading: true,
    errorText: "",
    submitting: false,
  },
  onLoad(options = {}) {
    this.setData({ reviewId: options.reviewId || "" });
    this.loadReview();
  },

  async loadReview() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await reviewService.adminGetReviewDetail({
        reviewId: this.data.reviewId,
      });
      this.setData({ review: data.review });
    } catch (error) {
      const errorText = error.message || "评价加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  onReasonInput(event) {
    this.setData({ reason: event.detail.value });
  },

  async hideReview() {
    this.setData({ submitting: true });
    showLoading("处理中");
    try {
      await reviewService.adminHideReview({
        reviewId: this.data.reviewId,
        reason: this.data.reason,
      });
      hideLoading();
      showSuccess("评价已隐藏");
      await this.loadReview();
    } catch (error) {
      hideLoading();
      showError(error.message || "隐藏失败");
    } finally {
      this.setData({ submitting: false });
    }
  },

  async restoreReview() {
    this.setData({ submitting: true });
    showLoading("处理中");
    try {
      await reviewService.adminRestoreReview({
        reviewId: this.data.reviewId,
        reason: this.data.reason,
      });
      hideLoading();
      showSuccess("评价已恢复");
      await this.loadReview();
    } catch (error) {
      hideLoading();
      showError(error.message || "恢复失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
