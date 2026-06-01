const cloud = require('wx-server-sdk')
const { handlePromotion } = require('./handler')
const {
  createCouponTemplateRepository,
  createMemberPlanRepository,
  createMembershipRepository,
  createUserCouponRepository,
  createUserRepository
} = require('./repositories')

cloud.init({
  env: cloud.DYNAMIC_CURRENT_ENV
})

exports.main = async (event = {}) => {
  const wxContext = cloud.getWXContext()
  const db = cloud.database()
  const source = wxContext.SOURCE || ''
  const openid = wxContext.OPENID || (source.includes('scf') ? event._internal_openid : '')

  return handlePromotion(event, {
    openid,
    users: createUserRepository(db),
    memberPlans: createMemberPlanRepository(db),
    memberships: createMembershipRepository(db),
    couponTemplates: createCouponTemplateRepository(db),
    userCoupons: createUserCouponRepository(db)
  })
}
