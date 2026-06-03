const promotionService = require("../../../services/promotion.service");
const { formatPrice } = require("../../../utils/format");
const { getStatusView } = require("../../../utils/status-view");
const { showError } = require("../../../utils/toast");

function mapCoupon(coupon = {}) {
  const statusView = getStatusView("coupon", coupon.status);
  return {
    ...coupon,
    statusText: statusView.text,
    statusTone: statusView.tone,
    amountText: formatPrice(coupon.amount),
  };
}

Page({
  data: {
    title: "我的优惠券",
    coupons: [],
    loading: true,
  },

  onShow() {
    this.loadCoupons();
  },

  async loadCoupons() {
    this.setData({ loading: true });
    try {
      const data = await promotionService.getMyCoupons();
      this.setData({ coupons: (data.coupons || []).map(mapCoupon) });
    } catch (error) {
      showError(error.message || "优惠券加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  goReceive() {
    wx.navigateTo({ url: "/pages/coupon/receive/receive" });
  },
});
