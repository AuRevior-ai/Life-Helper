const refundService = require("../../../services/refund.service");
const {
  AFTER_SALE_STATUS_TEXT,
  AFTER_SALE_TYPE_TEXT,
  REFUND_STATUS_TEXT,
} = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

Page({
  data: {
    title: "售后详情",
    afterSaleId: "",
    afterSale: null,
    order: null,
    refundLogs: [],
    typeText: "",
    statusText: "",
    refundStatusText: "",
    amountText: "¥0.00",
    loading: true,
  },

  onLoad(options = {}) {
    this.setData({
      afterSaleId: options.afterSaleId || "",
    });
    this.loadDetail();
  },

  async loadDetail() {
    if (!this.data.afterSaleId) {
      this.setData({ loading: false });
      showError("缺少售后 ID");
      return;
    }

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
        typeText: AFTER_SALE_TYPE_TEXT[afterSale.type] || afterSale.type,
        statusText:
          AFTER_SALE_STATUS_TEXT[afterSale.status] || afterSale.status,
        refundStatusText:
          REFUND_STATUS_TEXT[order.refund_status || "none"] || "未退款",
        amountText: formatPrice(afterSale.amount),
        loading: false,
      });
    } catch (error) {
      showError(error.message || "售后详情加载失败");
      this.setData({ loading: false });
    }
  },
});
