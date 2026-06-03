const PROMOTION_SOURCE = Object.freeze({
  NONE: "none",
  MEMBER: "member",
  COUPON: "coupon",
  MEMBER_AND_COUPON: "member_and_coupon",
});

const COUPON_TYPE = Object.freeze({
  AMOUNT_OFF: "amount_off",
  DISCOUNT: "discount",
  FULL_REDUCTION: "full_reduction",
});

function toAmount(value) {
  const amount = Number(value || 0);
  if (!Number.isFinite(amount) || amount < 0) return 0;
  return Math.round(amount);
}

function calculateMemberDiscount(originalAmount, membership) {
  if (!membership || !membership.discount_rate) return 0;
  const discountRate = Number(membership.discount_rate);
  if (!Number.isFinite(discountRate) || discountRate <= 0 || discountRate >= 1)
    return 0;
  return Math.min(
    Math.round(originalAmount * (1 - discountRate)),
    originalAmount,
  );
}

function calculateCouponDiscount(
  amountAfterMember,
  coupon = {},
  originalAmount = amountAfterMember,
) {
  if (!coupon || !coupon.type) return 0;

  if (coupon.type === COUPON_TYPE.FULL_REDUCTION) {
    const threshold = toAmount(coupon.threshold_amount);
    if (originalAmount < threshold) return 0;
    return Math.min(toAmount(coupon.amount), amountAfterMember);
  }

  if (coupon.type === COUPON_TYPE.DISCOUNT) {
    const rate = Number(coupon.discount_rate);
    if (!Number.isFinite(rate) || rate <= 0 || rate >= 1) return 0;
    const discount = Math.round(amountAfterMember * (1 - rate));
    const maxDiscount = toAmount(coupon.max_discount_amount);
    return Math.min(
      maxDiscount ? Math.min(discount, maxDiscount) : discount,
      amountAfterMember,
    );
  }

  return Math.min(toAmount(coupon.amount), amountAfterMember);
}

function buildPromotionSource(memberDiscountAmount, couponDiscountAmount) {
  if (memberDiscountAmount > 0 && couponDiscountAmount > 0) {
    return PROMOTION_SOURCE.MEMBER_AND_COUPON;
  }
  if (memberDiscountAmount > 0) return PROMOTION_SOURCE.MEMBER;
  if (couponDiscountAmount > 0) return PROMOTION_SOURCE.COUPON;
  return PROMOTION_SOURCE.NONE;
}

function calculateOrderPromotion({ service, membership, coupon }) {
  const originalAmount = toAmount(service && service.price);
  const memberDiscountAmount = calculateMemberDiscount(
    originalAmount,
    membership,
  );
  const amountAfterMember = Math.max(originalAmount - memberDiscountAmount, 0);
  const couponDiscountAmount = calculateCouponDiscount(
    amountAfterMember,
    coupon,
    originalAmount,
  );
  const totalDiscountAmount = Math.min(
    memberDiscountAmount + couponDiscountAmount,
    originalAmount,
  );
  const payableAmount = Math.max(originalAmount - totalDiscountAmount, 0);

  return {
    original_amount: originalAmount,
    member_discount_amount: memberDiscountAmount,
    coupon_discount_amount: couponDiscountAmount,
    total_discount_amount: totalDiscountAmount,
    payable_amount: payableAmount,
    promotion_source: buildPromotionSource(
      memberDiscountAmount,
      couponDiscountAmount,
    ),
    member_snapshot: membership
      ? {
          level: membership.level || "",
          discount_rate: Number(membership.discount_rate || 0),
          member_plan_id: membership.member_plan_id || membership._id || "",
        }
      : {
          level: "",
          discount_rate: 0,
          member_plan_id: "",
        },
    coupon_snapshot: coupon
      ? {
          user_coupon_id: coupon._id || "",
          coupon_template_id: coupon.coupon_template_id || "",
          coupon_name: coupon.coupon_name || coupon.name || "",
          type: coupon.type || "",
          amount: toAmount(coupon.amount),
          discount_rate: Number(coupon.discount_rate || 0),
          threshold_amount: toAmount(coupon.threshold_amount),
        }
      : {
          user_coupon_id: "",
          coupon_template_id: "",
          coupon_name: "",
          type: "",
          amount: 0,
          discount_rate: 0,
          threshold_amount: 0,
        },
  };
}

module.exports = {
  COUPON_TYPE,
  PROMOTION_SOURCE,
  calculateOrderPromotion,
};
