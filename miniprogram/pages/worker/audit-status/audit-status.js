const workerService = require("../../../services/worker.service");
const { formatWorkerAuditStatus } = require("../../../utils/format");
const { showError, showToast } = require("../../../utils/toast");

const APPROVED_REDIRECT_DELAY = 3000;
const APPROVED_REDIRECT_TIP = "您已通过审核，即将跳转到接单大厅";

Page({
  data: {
    title: "审核状态",
    worker: null,
    auditStatus: "not_applied",
    auditStatusText: "未申请",
    loading: true,
    isApproved: false,
    isRejected: false,
    isNotApplied: false,
    approvedTip: APPROVED_REDIRECT_TIP,
    rejectedTip: "未通过审核，请联系管理员",
  },

  onShow() {
    this.loadAuditStatus();
  },

  onHide() {
    this.clearApprovedRedirectTimer();
  },

  onUnload() {
    this.clearApprovedRedirectTimer();
  },

  async loadAuditStatus() {
    this.clearApprovedRedirectTimer();
    this.setData({ loading: true });
    try {
      const data = await workerService.getAuditStatus();
      const auditStatus = data.audit_status || "not_applied";
      this.setData({
        worker: data.worker || null,
        auditStatus,
        auditStatusText:
          auditStatus === "not_applied"
            ? "未申请"
            : formatWorkerAuditStatus(auditStatus),
        isApproved: auditStatus === "approved",
        isRejected: auditStatus === "rejected",
        isNotApplied: auditStatus === "not_applied",
      });
      if (auditStatus === "approved") {
        this.scheduleApprovedRedirect();
      }
    } catch (error) {
      showError(error.message || "状态加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  clearApprovedRedirectTimer() {
    if (this.approvedRedirectTimer) {
      clearTimeout(this.approvedRedirectTimer);
      this.approvedRedirectTimer = null;
    }
  },

  scheduleApprovedRedirect() {
    showToast(APPROVED_REDIRECT_TIP);
    this.approvedRedirectTimer = setTimeout(() => {
      this.approvedRedirectTimer = null;
      wx.redirectTo({
        url: "/pages/worker/order-hall/order-hall",
      });
    }, APPROVED_REDIRECT_DELAY);
  },

  goApply() {
    wx.redirectTo({
      url: "/pages/worker/apply/apply",
    });
  },

  goBack() {
    const pages = typeof getCurrentPages === "function" ? getCurrentPages() : [];
    if (pages.length > 1) {
      wx.navigateBack();
      return;
    }
    wx.redirectTo({
      url: "/pages/role-select/role-select",
    });
  },
});
