const reviewService = require("../../../services/review.service");
const {
  hideLoading,
  showError,
  showLoading,
  showSuccess,
} = require("../../../utils/toast");

Page({
  data: {
    title: "追加评价",
    reviewId: "",
    content: "",
    submitting: false,
  },

  onLoad(options = {}) {
    this.setData({ reviewId: options.reviewId || "" });
  },

  onInput(event) {
    this.setData({ content: event.detail.value });
  },

  async submit() {
    this.setData({ submitting: true });
    showLoading("提交中");
    try {
      await reviewService.addReviewFollowup({
        reviewId: this.data.reviewId,
        content: this.data.content,
      });
      showSuccess("追评成功");
      wx.navigateBack();
    } catch (error) {
      showError(error.message || "追评失败");
    } finally {
      hideLoading();
      this.setData({ submitting: false });
    }
  },
});
