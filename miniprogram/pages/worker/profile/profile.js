const workerService = require("../../../services/worker.service");
const orderService = require("../../../services/order.service");
const messageService = require("../../../services/message.service");
const {
  WORKER_AUDIT_STATUS,
  WORKER_ONLINE_STATUS,
} = require("../../../config/status");
const { clearCurrentUser, getCurrentUser } = require("../../../utils/auth");
const { showError, showSuccess, showToast } = require("../../../utils/toast");

const WORKER_AVATAR_PLACEHOLDER = "/assets/worker/师傅默认头像.png";

function firstPresent(...values) {
  return values.find((value) => value !== undefined && value !== null && value !== "");
}

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isFinite(rating) || rating <= 0) return "4.9";
  return rating.toFixed(1);
}

function formatWorkerDashboardPrice(value) {
  const cents = Number.isFinite(Number(value)) ? Number(value) : 0;
  const amount = Math.round(cents / 100);
  return `¥${amount.toLocaleString("en-US")}`;
}

function normalizeWorkerName(worker, user) {
  return firstPresent(
    worker.name,
    worker.real_name,
    worker.nickname,
    user && user.nickname,
    "王师傅",
  );
}

function normalizeServiceRange(worker) {
  const radius = Number(worker.service_radius_km || worker.serviceRadiusKm || 0);
  const radiusText = radius ? ` ${radius}km` : "";
  const communities = Array.isArray(worker.service_communities)
    ? worker.service_communities.join("、")
    : "";
  return firstPresent(
    worker.service_area,
    communities,
    worker.base_poi_name && `${worker.base_poi_name}${radiusText}`,
    worker.base_address && `${worker.base_address}${radiusText}`,
    "高新区 · 锦业路周边 3km",
  );
}

Page({
  data: {
    title: "我的",
    worker: {},
    avatar: WORKER_AVATAR_PLACEHOLDER,
    workerName: "王师傅",
    auditTagText: "认证师傅",
    online_status: WORKER_ONLINE_STATUS.AVAILABLE,
    isOnline: true,
    onlineText: "在线接单",
    ratingText: "4.9",
    monthlyFinishedText: "38",
    serviceRangeText: "高新区 · 锦业路周边 3km",
    safeStats: {
      incomeText: "¥0",
      pendingReviews: 0,
      unreadMessages: 0,
      rating: "4.9",
    },
  },

  onShow() {
    this.loadDashboard();
  },

  async loadDashboard() {
    const [workerResult, incomeResult, unreadResult] = await Promise.allSettled([
      workerService.getWorkerInfo(),
      orderService.getWorkerIncomeStats(),
      messageService.getUnreadCount(),
    ]);

    if (workerResult.status === "rejected") {
      showError(workerResult.reason.message || "师傅信息加载失败");
    }

    const worker =
      workerResult.status === "fulfilled" ? workerResult.value.worker || {} : {};
    const incomeStats =
      incomeResult.status === "fulfilled" ? incomeResult.value || {} : {};
    const unreadStats =
      unreadResult.status === "fulfilled" ? unreadResult.value || {} : {};

    this.applyDashboardData(worker, incomeStats, unreadStats);
  },

  applyDashboardData(worker, incomeStats, unreadStats) {
    const currentUser = getCurrentUser() || {};
    const onlineStatus =
      worker.online_status || worker.onlineStatus || WORKER_ONLINE_STATUS.AVAILABLE;
    const isOnline = onlineStatus !== WORKER_ONLINE_STATUS.PAUSED;
    const completedCount = firstPresent(
      worker.monthly_finished_count,
      worker.monthlyFinishedCount,
      incomeStats.completed_count,
      38,
    );
    const ratingText = normalizeRating(
      firstPresent(worker.rating, worker.average_rating, worker.rating_avg),
    );
    const safeStats = {
      incomeText: formatWorkerDashboardPrice(incomeStats.total_amount || 0),
      pendingReviews: Number(
        firstPresent(worker.pending_reviews, worker.pendingReviews, 2),
      ),
      unreadMessages: Number(
        firstPresent(unreadStats.unread_count, unreadStats.unreadCount, 5),
      ),
      rating: ratingText,
    };

    this.setData({
      worker,
      avatar: worker.avatar || WORKER_AVATAR_PLACEHOLDER,
      workerName: normalizeWorkerName(worker, currentUser),
      auditTagText:
        worker.audit_status === WORKER_AUDIT_STATUS.APPROVED
          ? "认证师傅"
          : "师傅资料",
      online_status: onlineStatus,
      isOnline,
      onlineText: isOnline ? "在线接单" : "暂停接单",
      ratingText,
      monthlyFinishedText: String(completedCount),
      serviceRangeText: normalizeServiceRange(worker),
      safeStats,
    });
  },

  async onOnlineSwitchChange(event) {
    const isOnline = Boolean(event.detail.value);
    const onlineStatus = isOnline
      ? WORKER_ONLINE_STATUS.AVAILABLE
      : WORKER_ONLINE_STATUS.PAUSED;

    try {
      const data = await workerService.updateWorkerOnlineStatus({
        online_status: onlineStatus,
      });
      const worker = data.worker || {
        ...this.data.worker,
        online_status: onlineStatus,
      };
      this.setData({
        worker,
        online_status: onlineStatus,
        isOnline,
        onlineText: isOnline ? "在线接单" : "暂停接单",
      });
      showSuccess("接单状态已更新");
      this.loadDashboard();
    } catch (error) {
      this.setData({ isOnline: !isOnline });
      showError(error.message || "状态更新失败");
    }
  },

  handleMenuTap(event) {
    const url = event.currentTarget.dataset.url;
    if (url) {
      wx.navigateTo({ url });
      return;
    }
    showToast("功能建设中");
  },

  goProfileEdit() {
    wx.navigateTo({
      url: "/pages/profile-edit/profile-edit",
    });
  },

  goServiceRange() {
    wx.navigateTo({
      url: "/pages/provider/service-range/service-range",
    });
  },

  goReviewList() {
    wx.navigateTo({
      url: "/pages/worker/review-list/review-list",
    });
  },

  goMessageList() {
    wx.navigateTo({
      url: "/pages/message-list/message-list",
    });
  },

  switchIdentity() {
    wx.navigateTo({
      url: "/pages/role-select/role-select",
    });
  },

  logout() {
    wx.showModal({
      title: "退出登录",
      content: "确认退出当前账号吗？",
      confirmText: "退出",
      cancelText: "取消",
      success: (res) => {
        if (!res.confirm) return;
        clearCurrentUser();
        getApp().globalData.currentUser = null;
        showSuccess("已退出登录");
        wx.reLaunch({
          url: "/pages/profile/profile",
        });
      },
    });
  },
});
