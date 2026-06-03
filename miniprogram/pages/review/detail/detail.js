const reviewService = require("../../../services/review.service");
const { showError } = require("../../../utils/toast");

Page({
  data: {
    title: "评价详情",
    reviewId: "",
    review: null,
    loading: true,
  },

  onLoad(options = {}) {
    this.setData({ reviewId: options.reviewId || "" });
    this.loadReview();
  },

  async loadReview() {
    if (!this.data.reviewId) {
      this.setData({ loading: false });
      showError("缺少评价 ID");
      return;
    }
    try {
      const data = await reviewService.getReviewDetail({
        reviewId: this.data.reviewId,
      });
      this.setData({ review: data.review });
    } catch (error) {
      showError(error.message || "评价加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goFollowup() {
    wx.navigateTo({
      url: `/pages/review/followup/followup?reviewId=${this.data.reviewId}`,
    });
  },
});
