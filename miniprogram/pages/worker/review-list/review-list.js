const reviewService = require("../../../services/review.service");
const { showError } = require("../../../utils/toast");

Page({
  data: { title: "我的评价", reviews: [], loading: true },
  onShow() {
    this.loadReviews();
  },
  async loadReviews() {
    try {
      const data = await reviewService.getWorkerReviewList();
      this.setData({ reviews: data.reviews || [] });
    } catch (error) {
      showError(error.message || "评价加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },
  goDetail(event) {
    wx.navigateTo({
      url: `/pages/worker/review-detail/review-detail?reviewId=${event.currentTarget.dataset.id}`,
    });
  },
});
