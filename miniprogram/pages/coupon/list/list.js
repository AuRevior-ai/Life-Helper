const promotionService = require("../../../services/promotion.service");
const { USER_COUPON_STATUS_TEXT } = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError } = require("../../../utils/toast");

function mapCoupon(coupon = {}) {
  return {
    ...coupon,
    statusText: USER_COUPON_STATUS_TEXT[coupon.status] || coupon.status,
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
