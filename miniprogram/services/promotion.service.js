const { CLOUD_FUNCTIONS } = require('../config/constants')
const { createActionService } = require('./_base.service')

module.exports = createActionService(CLOUD_FUNCTIONS.PROMOTION, [
  'getMemberPlans',
  'mockOpenMembership',
  'getMyMembership',
  'adminGetMemberPlans',
  'adminUpdateMemberPlan',
  'adminCreateCouponTemplate',
  'adminUpdateCouponTemplate',
  'adminGetCouponTemplates',
  'adminEnableCouponTemplate',
  'adminDisableCouponTemplate',
  'getReceivableCoupons',
  'receiveCoupon',
  'getMyCoupons',
  'getAvailableCouponsForOrder',
  'calculateOrderPromotion',
  'lockCouponForOrder',
  'useCouponForOrder',
  'releaseCouponForOrder'
])

