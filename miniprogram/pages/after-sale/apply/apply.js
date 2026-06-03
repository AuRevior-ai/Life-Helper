const refundService = require("../../../services/refund.service");
const { AFTER_SALE_TYPE } = require("../../../config/status");
const {
  hideLoading,
  showError,
  showLoading,
  showSuccess,
} = require("../../../utils/toast");

Page({
  data: {
    title: "申请售后",
    orderId: "",
    type: AFTER_SALE_TYPE.REFUND_ONLY,
    reason: "",
    description: "",
    images: [],
    submitting: false,
  },

  onLoad(options = {}) {
    this.setData({
      orderId: options.orderId || "",
    });
  },

  handleTypeChange(event) {
    this.setData({
      type: event.detail.value,
    });
  },

  handleReasonInput(event) {
    this.setData({
      reason: event.detail.value,
    });
  },

  handleDescriptionInput(event) {
    this.setData({
      description: event.detail.value,
    });
  },

  chooseImages() {
    wx.chooseImage({
      count: 3,
      success: (res) => {
        this.setData({
          images: (res.tempFilePaths || []).slice(0, 3),
        });
      },
    });
  },

  async submitAfterSale() {
    if (!this.data.reason.trim()) {
      showError("请填写售后原因");
      return;
    }

    this.setData({ submitting: true });
    showLoading("提交中");
    try {
      const data = await refundService.createAfterSale({
        orderId: this.data.orderId,
        type: this.data.type,
        reason: this.data.reason,
        description: this.data.description,
        images: this.data.images,
      });
      showSuccess("已提交");
      wx.redirectTo({
        url: `/pages/after-sale/detail/detail?afterSaleId=${data.afterSale._id}`,
      });
    } catch (error) {
      showError(error.message || "提交失败");
    } finally {
      hideLoading();
      this.setData({ submitting: false });
    }
  },
});
