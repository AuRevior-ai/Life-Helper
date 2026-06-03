const userService = require("../../services/user.service");
const { getCurrentUser, setCurrentUser } = require("../../utils/auth");
const { showError, showSuccess } = require("../../utils/toast");

function isValidPhone(phone) {
  return /^1\d{10}$/.test(`${phone || ""}`.trim());
}

Page({
  data: {
    title: "完善资料",
    nickname: "",
    phone: "",
    submitting: false,
  },

  onLoad() {
    const user = getCurrentUser() || {};
    this.setData({
      nickname: user.nickname || "",
      phone: user.phone || "",
    });
  },

  onNicknameInput(event) {
    this.setData({
      nickname: event.detail.value,
    });
  },

  onPhoneInput(event) {
    this.setData({
      phone: event.detail.value,
    });
  },

  async saveProfile() {
    const nickname = `${this.data.nickname || ""}`.trim();
    const phone = `${this.data.phone || ""}`.trim();

    if (!nickname) {
      showError("请填写昵称");
      return;
    }

    if (phone && !isValidPhone(phone)) {
      showError("PHONE_INVALID");
      return;
    }

    this.setData({ submitting: true });
    try {
      const data = await userService.updateUserInfo({
        nickname,
        phone,
      });
      setCurrentUser(data.user);
      getApp().globalData.currentUser = data.user;
      showSuccess("资料已保存");
      wx.navigateBack();
    } catch (error) {
      showError(error.message || "保存失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
