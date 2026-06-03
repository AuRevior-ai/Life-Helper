const addressService = require("../../services/address.service");
const { showError, showSuccess } = require("../../utils/toast");

Page({
  data: {
    title: "地址管理",
    addresses: [],
    loading: true,
  },

  onShow() {
    this.loadAddressList();
  },

  onPullDownRefresh() {
    this.loadAddressList().finally(() => {
      wx.stopPullDownRefresh();
    });
  },

  async loadAddressList() {
    this.setData({ loading: true });
    try {
      const data = await addressService.getAddressList();
      this.setData({
        addresses: data.addresses || [],
      });
    } catch (error) {
      showError(error.message || "地址加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goAddAddress() {
    wx.navigateTo({
      url: "/pages/address-edit/address-edit",
    });
  },

  goEditAddress(event) {
    const addressId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/address-edit/address-edit?addressId=${addressId}`,
    });
  },

  async handleSetDefault(event) {
    const addressId = event.currentTarget.dataset.id;
    try {
      await addressService.setDefaultAddress({ addressId });
      showSuccess("已设为默认");
      this.loadAddressList();
    } catch (error) {
      showError(error.message || "设置失败");
    }
  },

  handleDeleteAddress(event) {
    const addressId = event.currentTarget.dataset.id;
    wx.showModal({
      title: "删除地址",
      content: "确认删除这个服务地址吗？",
      confirmColor: "#c66b2d",
      success: async (res) => {
        if (!res.confirm) return;
        try {
          await addressService.deleteAddress({ addressId });
          showSuccess("已删除");
          this.loadAddressList();
        } catch (error) {
          showError(error.message || "删除失败");
        }
      },
    });
  },
});
