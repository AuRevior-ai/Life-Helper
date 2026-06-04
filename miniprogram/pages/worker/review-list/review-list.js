const reviewService = require("../../../services/review.service");
const { showError } = require("../../../utils/toast");

function formatReviewTime(review = {}) {
  return review.created_at || review.reviewed_at || review.updated_at || "时间待确认";
}

function normalizeReview(review = {}) {
  const rating = Number(review.rating || 0);
  return {
    ...review,
    serviceName: review.service_name || "服务订单",
    ratingText: Number.isFinite(rating) && rating > 0 ? `${rating} 分` : "未评分",
    contentText: review.content || "用户暂未填写文字评价",
    userName: review.is_anonymous ? "匿名用户" : review.user_nickname || "用户",
    timeText: formatReviewTime(review),
    replyStatusText: review.worker_reply_content ? "已回复" : "待回复",
  };
}

function buildRatingOverview(reviews = []) {
  const count = reviews.length;
  const ratingSum = reviews.reduce((sum, review) => sum + Number(review.rating || 0), 0);
  const goodCount = reviews.filter((review) => Number(review.rating || 0) >= 4).length;
  return {
    count,
    averageText: count ? (ratingSum / count).toFixed(1) : "0.0",
    goodRateText: count ? `${Math.round((goodCount / count) * 100)}%` : "0%",
  };
}

Page({
  data: {
    title: "我的评价",
    reviews: [],
    ratingOverview: buildRatingOverview(),
    loading: true,
  },

  onShow() {
    this.loadReviews();
  },

  async loadReviews() {
    this.setData({ loading: true });
    try {
      const data = await reviewService.getWorkerReviewList();
      const reviews = (data.reviews || []).map(normalizeReview);
      this.setData({
        reviews,
        ratingOverview: buildRatingOverview(reviews),
      });
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
