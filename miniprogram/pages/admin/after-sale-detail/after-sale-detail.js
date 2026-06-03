const refundService = require("../../../services/refund.service");
const {
  AFTER_SALE_STATUS_TEXT,
  REFUND_STATUS_TEXT,
} = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: {
    title: "售后审核",
    afterSaleId: "",
    afterSale: null,
    order: null,
    refundLogs: [],
    statusText: "",
    refundStatusText: "",
    amountText: "¥0.00",
    adminRemark: "",
    loading: true,
    submitting: false,
  },

  onLoad(options = {}) {
    this.setData({
      afterSaleId: options.afterSaleId || "",
    });
    this.loadDetail();
  },

  async loadDetail() {
    this.setData({ loading: true });
    try {
      const data = await refundService.getAfterSaleDetail({
        afterSaleId: this.data.afterSaleId,
      });
      const afterSale = data.afterSale;
      const order = data.order || {};
      this.setData({
        afterSale,
        order,
        refundLogs: data.refundLogs || [],
        statusText:
          AFTER_SALE_STATUS_TEXT[afterSale.status] || afterSale.status,
        refundStatusText:
          REFUND_STATUS_TEXT[order.refund_status || "none"] || "未退款",
        amountText: formatPrice(afterSale.amount),
        adminRemark: afterSale.admin_remark || "",
      });
    } catch (error) {
      showError(error.message || "售后详情加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  handleRemarkInput(event) {
    this.setData({
      adminRemark: event.detail.value,
    });
  },

  async reviewAfterSale(event) {
    const reviewStatus = event.currentTarget.dataset.status;
    this.setData({ submitting: true });
    try {
      await refundService.adminReviewAfterSale({
        afterSaleId: this.data.afterSaleId,
        reviewStatus,
        adminRemark: this.data.adminRemark,
      });
      showSuccess(reviewStatus === "approved" ? "已通过并退款" : "已拒绝");
      this.loadDetail();
    } catch (error) {
      showError(error.message || "审核失败");
    } finally {
      this.setData({ submitting: false });
    }
  },
});
