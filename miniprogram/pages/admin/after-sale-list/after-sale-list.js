const refundService = require("../../../services/refund.service");
const {
  AFTER_SALE_STATUS,
  AFTER_SALE_STATUS_TEXT,
} = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

const STATUS_FILTERS = [
  { label: "全部", value: "" },
  { label: "待审核", value: AFTER_SALE_STATUS.PENDING },
  { label: "已通过", value: AFTER_SALE_STATUS.APPROVED },
  { label: "已拒绝", value: AFTER_SALE_STATUS.REJECTED },
];

function mapAfterSale(afterSale) {
  return {
    ...afterSale,
    statusText: AFTER_SALE_STATUS_TEXT[afterSale.status] || afterSale.status,
    amountText: formatPrice(afterSale.amount),
  };
}

Page({
  data: {
    title: "售后管理",
    afterSales: [],
    status: "",
    statusFilters: STATUS_FILTERS,
    loading: true,
    errorText: "",
  },

  onShow() {
    this.loadAfterSales();
  },

  async loadAfterSales() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await refundService.adminGetAfterSaleList({
        status: this.data.status,
      });
      this.setData({
        afterSales: (data.afterSales || []).map(mapAfterSale),
      });
    } catch (error) {
      const errorText = error.message || "售后列表加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },

  onStatusFilterTap(event) {
    const status = event.currentTarget.dataset.status || "";
    if (status === this.data.status) return;
    this.setData({ status });
    this.loadAfterSales();
  },

  goDetail(event) {
    const afterSaleId = event.currentTarget.dataset.id;
    wx.navigateTo({
      url: `/pages/admin/after-sale-detail/after-sale-detail?afterSaleId=${afterSaleId}`,
    });
  },
});
