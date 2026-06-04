const {
  clearCurrentUser,
  getCurrentUser,
  setCurrentIdentityRole,
} = require("../../../utils/auth");
const { USER_ROLE } = require("../../../config/roles");
const { showSuccess, showToast } = require("../../../utils/toast");

function maskPhone(phone) {
  const value = `${phone || ""}`.trim();
  if (value.length < 7) return value || "155****8888";
  return `${value.slice(0, 3)}****${value.slice(-4)}`;
}

Page({
  data: {
    adminName: "张管理员",
    adminInitial: "管",
    maskedPhone: "155****8888",
    lastLoginText: "今天 09:28",
  },

  onShow() {
    this.applyCurrentUser();
  },

  applyCurrentUser() {
    const user = getCurrentUser();
    const adminName = user && user.nickname ? user.nickname : "张管理员";
    this.setData({
      adminName,
      adminInitial: adminName.slice(0, 1) || "管",
      maskedPhone: maskPhone(user && user.phone),
    });
  },

  handleLogout() {
    clearCurrentUser();
    getApp().globalData.currentUser = null;
    showSuccess("已退出登录");
    wx.switchTab({
      url: "/pages/profile/profile",
    });
  },

  goRoleSelect() {
    wx.navigateTo({
      url: "/pages/role-select/role-select",
    });
  },

  goProfileEdit() {
    wx.navigateTo({
      url: "/pages/profile-edit/profile-edit",
    });
  },

  goMessageList() {
    wx.navigateTo({
      url: "/pages/message-list/message-list",
    });
  },

  goSystemStatus() {
    showToast("系统状态为内部展示信息");
  },

  goUserHome() {
    const user = setCurrentIdentityRole(USER_ROLE.USER);
    if (user) {
      getApp().globalData.currentUser = user;
    }
    wx.switchTab({
      url: "/pages/index/index",
    });
  },
});
