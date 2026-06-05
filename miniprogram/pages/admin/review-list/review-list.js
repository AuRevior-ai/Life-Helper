const reviewService = require("../../../services/review.service");
const { showError } = require("../../../utils/toast");

function getWorkerName(review = {}) {
  return (
    review.worker_name ||
    review.worker_nickname ||
    review.worker_id ||
    "未分配师傅"
  );
}

function groupReviewsByWorker(reviews = []) {
  const groups = [];
  const groupMap = {};
  for (const review of reviews) {
    const workerId = review.worker_id || "unknown";
    if (!groupMap[workerId]) {
      groupMap[workerId] = {
        workerId,
        workerName: getWorkerName(review),
        reviews: [],
      };
      groups.push(groupMap[workerId]);
    }
    groupMap[workerId].reviews.push(review);
  }
  return groups;
}

Page({
  data: {
    title: "评价管理",
    reviews: [],
    groupedReviews: [],
    filterPills: ["全部评价", "按师傅分组", "人工治理"],
    loading: true,
    errorText: "",
  },

  onShow() {
    this.loadReviews();
  },

  async loadReviews() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await reviewService.adminGetReviewList();
      const reviews = data.reviews || [];
      this.setData({
        reviews,
        groupedReviews: groupReviewsByWorker(reviews),
      });
    } catch (error) {
      const errorText = error.message || "评价加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  goDetail(event) {
    wx.navigateTo({
      url: `/pages/admin/review-detail/review-detail?reviewId=${event.currentTarget.dataset.id}`,
    });
  },
});
