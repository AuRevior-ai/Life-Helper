const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function fixedNow() {
  return new Date('2026-06-01T08:00:00.000Z')
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath))
}

function createMemoryUsers(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    async findByOpenid(openid) {
      const user = records.find((item) => item.openid === openid)
      return user ? { ...user } : null
    }
  }
}

function createMemoryCollection(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async create(data) {
      const record = { ...data, _id: data._id || `record_${records.length + 1}` }
      records.push(record)
      return { ...record }
    },
    async findById(id) {
      const record = records.find((item) => item._id === id)
      return record ? { ...record } : null
    },
    async findAll() {
      return records.map((item) => ({ ...item }))
    },
    async updateById(id, data) {
      const record = records.find((item) => item._id === id)
      if (!record) return null
      Object.assign(record, data)
      return { ...record }
    }
  }
}

function createMemoryMemberships(initial = []) {
  const base = createMemoryCollection(initial)
  return {
    ...base,
    async findActiveByUserId(userId, now) {
      const record = base.records.find((item) =>
        item.user_id === userId && item.status === 'active' && new Date(item.expired_at) > now
      )
      return record ? { ...record } : null
    },
    async findByUserId(userId) {
      const records = base.records.filter((item) => item.user_id === userId)
      return records[0] ? { ...records[0] } : null
    }
  }
}

function createMemoryCouponTemplates(initial = []) {
  const base = createMemoryCollection(initial)
  return {
    ...base,
    async findActive() {
      return base.records.filter((item) => item.status === 'active').map((item) => ({ ...item }))
    }
  }
}

function createMemoryUserCoupons(initial = []) {
  const base = createMemoryCollection(initial)
  return {
    ...base,
    async findByUserId(userId) {
      return base.records.filter((item) => item.user_id === userId).map((item) => ({ ...item }))
    },
    async findByUserAndTemplate(userId, templateId) {
      return base.records
        .filter((item) => item.user_id === userId && item.coupon_template_id === templateId)
        .map((item) => ({ ...item }))
    },
    async lockUnusedCoupon(id, userId, orderId, data) {
      const record = base.records.find((item) => item._id === id && item.user_id === userId && item.status === 'unused')
      if (!record) return null
      Object.assign(record, data, { status: 'locked', locked_order_id: orderId })
      return { ...record }
    },
    async useLockedCoupon(id, orderId, data) {
      const record = base.records.find((item) => item._id === id && item.status === 'locked' && item.locked_order_id === orderId)
      if (!record) return null
      Object.assign(record, data, { status: 'used', used_order_id: orderId })
      return { ...record }
    },
    async releaseLockedCoupon(id, orderId, data) {
      const record = base.records.find((item) => item._id === id && item.status === 'locked' && item.locked_order_id === orderId)
      if (!record) return null
      Object.assign(record, data, { status: 'unused', locked_order_id: '' })
      return { ...record }
    }
  }
}

function createMemoryOrders(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async create(data) {
      const record = { ...data, _id: `order_${records.length + 1}` }
      records.push(record)
      return { ...record }
    },
    async findById(id) {
      const order = records.find((item) => item._id === id)
      return order ? { ...order } : null
    },
    async updateById(id, data) {
      const order = records.find((item) => item._id === id)
      if (!order) return null
      Object.assign(order, data)
      return { ...order }
    }
  }
}

function createBasePromotionEnv(openid = 'openid_user') {
  return {
    openid,
    now: fixedNow,
    users: createMemoryUsers([
      { openid: 'openid_user', role: 'user', status: 'normal' },
      { openid: 'openid_admin', role: 'admin', status: 'normal' }
    ]),
    memberPlans: createMemoryCollection(),
    memberships: createMemoryMemberships(),
    couponTemplates: createMemoryCouponTemplates(),
    userCoupons: createMemoryUserCoupons()
  }
}

test('user can view member plans and mock open membership', async () => {
  const { handlePromotion } = require('../cloudfunctions/promotion/handler')
  const env = createBasePromotionEnv()

  const plansResult = await handlePromotion({ action: 'getMemberPlans' }, env)
  assert.equal(plansResult.success, true)
  assert.deepEqual(plansResult.data.plans.map((item) => item.level), ['monthly', 'seasonly', 'yearly'])

  const openResult = await handlePromotion({ action: 'mockOpenMembership', level: 'monthly' }, env)
  assert.equal(openResult.success, true)
  assert.equal(openResult.data.membership.level, 'monthly')
  assert.equal(openResult.data.membership.status, 'active')

  const myResult = await handlePromotion({ action: 'getMyMembership' }, env)
  assert.equal(myResult.data.membership.level, 'monthly')
})

test('admin manages coupon templates and users receive active coupons within limits', async () => {
  const { handlePromotion } = require('../cloudfunctions/promotion/handler')
  const env = createBasePromotionEnv('openid_admin')

  const userCreateResult = await handlePromotion({
    action: 'adminCreateCouponTemplate',
    name: '满100减10',
    type: 'full_reduction',
    amount: 1000,
    threshold_amount: 10000,
    total_quantity: 2,
    per_user_limit: 1,
    valid_days_after_receive: 7,
    status: 'active'
  }, { ...env, openid: 'openid_user' })
  assert.equal(userCreateResult.success, false)
  assert.equal(userCreateResult.errorCode, 'PERMISSION_DENIED')

  const createResult = await handlePromotion({
    action: 'adminCreateCouponTemplate',
    name: '满100减10',
    type: 'full_reduction',
    amount: 1000,
    threshold_amount: 10000,
    total_quantity: 2,
    per_user_limit: 1,
    valid_days_after_receive: 7,
    status: 'active'
  }, env)
  assert.equal(createResult.success, true)

  const userEnv = { ...env, openid: 'openid_user' }
  const receiveResult = await handlePromotion({
    action: 'receiveCoupon',
    couponTemplateId: createResult.data.template._id
  }, userEnv)
  assert.equal(receiveResult.success, true)
  assert.equal(receiveResult.data.userCoupon.status, 'unused')

  const duplicateResult = await handlePromotion({
    action: 'receiveCoupon',
    couponTemplateId: createResult.data.template._id
  }, userEnv)
  assert.equal(duplicateResult.success, false)
  assert.equal(duplicateResult.errorCode, 'COUPON_RECEIVE_LIMIT')

  const disabledTemplate = await handlePromotion({
    action: 'adminCreateCouponTemplate',
    name: '停用券',
    type: 'amount_off',
    amount: 500,
    total_quantity: 1,
    per_user_limit: 1,
    status: 'disabled'
  }, env)
  const disabledReceive = await handlePromotion({
    action: 'receiveCoupon',
    couponTemplateId: disabledTemplate.data.template._id
  }, userEnv)
  assert.equal(disabledReceive.success, false)
  assert.equal(disabledReceive.errorCode, 'COUPON_NOT_RECEIVABLE')
})

test('promotion calculation uses active membership, own valid coupon, and ignores frontend amount', async () => {
  const { handlePromotion } = require('../cloudfunctions/promotion/handler')
  const env = createBasePromotionEnv()
  const now = fixedNow()
  env.memberships.records.push({
    _id: 'membership_1',
    user_id: 'openid_user',
    member_plan_id: 'monthly',
    level: 'monthly',
    status: 'active',
    discount_rate: 0.95,
    expired_at: new Date(now.getTime() + 86400000)
  })
  env.userCoupons.records.push({
    _id: 'coupon_1',
    user_id: 'openid_user',
    coupon_template_id: 'tpl_1',
    coupon_name: '满100减10',
    type: 'full_reduction',
    amount: 1000,
    threshold_amount: 10000,
    status: 'unused',
    valid_start_at: now,
    valid_end_at: new Date(now.getTime() + 86400000)
  })

  const result = await handlePromotion({
    action: 'calculateOrderPromotion',
    service: { _id: 'svc_clean', price: 10000, category_id: 'cleaning' },
    userCouponId: 'coupon_1',
    payable_amount: 1
  }, env)

  assert.equal(result.success, true)
  assert.equal(result.data.original_amount, 10000)
  assert.equal(result.data.member_discount_amount, 500)
  assert.equal(result.data.coupon_discount_amount, 1000)
  assert.equal(result.data.payable_amount, 8500)
  assert.equal(result.data.promotion_source, 'member_and_coupon')

  const otherCouponResult = await handlePromotion({
    action: 'calculateOrderPromotion',
    service: { _id: 'svc_clean', price: 10000 },
    userCouponId: 'coupon_other'
  }, {
    ...env,
    userCoupons: createMemoryUserCoupons([
      { _id: 'coupon_other', user_id: 'openid_other', status: 'unused' }
    ])
  })
  assert.equal(otherCouponResult.success, false)
  assert.equal(otherCouponResult.errorCode, 'COUPON_NOT_AVAILABLE')
})

test('coupon below threshold is hidden and rejected for current order', async () => {
  const { handlePromotion } = require('../cloudfunctions/promotion/handler')
  const env = createBasePromotionEnv()
  const now = fixedNow()
  env.userCoupons.records.push({
    _id: 'coupon_1',
    user_id: 'openid_user',
    coupon_template_id: 'tpl_1',
    coupon_name: '满100减20',
    type: 'full_reduction',
    amount: 2000,
    threshold_amount: 10000,
    status: 'unused',
    valid_start_at: now,
    valid_end_at: new Date(now.getTime() + 86400000)
  })

  const listResult = await handlePromotion({
    action: 'getAvailableCouponsForOrder',
    service: { _id: 'svc_clean', price: 9900, category_id: 'cleaning' }
  }, env)
  assert.equal(listResult.success, true)
  assert.deepEqual(listResult.data.coupons, [])

  const calculateResult = await handlePromotion({
    action: 'calculateOrderPromotion',
    service: { _id: 'svc_clean', price: 9900, category_id: 'cleaning' },
    userCouponId: 'coupon_1'
  }, env)
  assert.equal(calculateResult.success, false)
  assert.equal(calculateResult.errorCode, 'COUPON_NOT_APPLICABLE')
})

test('coupon lock, use, and release are idempotent around an order', async () => {
  const { handlePromotion } = require('../cloudfunctions/promotion/handler')
  const env = createBasePromotionEnv()
  env.userCoupons.records.push({
    _id: 'coupon_1',
    user_id: 'openid_user',
    coupon_template_id: 'tpl_1',
    coupon_name: '立减5元',
    type: 'amount_off',
    amount: 500,
    status: 'unused',
    valid_start_at: fixedNow(),
    valid_end_at: new Date(fixedNow().getTime() + 86400000)
  })

  const lockResult = await handlePromotion({
    action: 'lockCouponForOrder',
    userCouponId: 'coupon_1',
    orderId: 'order_1'
  }, env)
  assert.equal(lockResult.success, true)
  assert.equal(lockResult.data.userCoupon.status, 'locked')

  const useResult = await handlePromotion({
    action: 'useCouponForOrder',
    userCouponId: 'coupon_1',
    orderId: 'order_1'
  }, env)
  assert.equal(useResult.success, true)
  assert.equal(useResult.data.userCoupon.status, 'used')

  const duplicateUse = await handlePromotion({
    action: 'useCouponForOrder',
    userCouponId: 'coupon_1',
    orderId: 'order_1'
  }, env)
  assert.equal(duplicateUse.success, true)
  assert.equal(duplicateUse.data.already_used, true)

  env.userCoupons.records.push({
    _id: 'coupon_2',
    user_id: 'openid_user',
    status: 'locked',
    locked_order_id: 'order_2'
  })
  const releaseResult = await handlePromotion({
    action: 'releaseCouponForOrder',
    userCouponId: 'coupon_2',
    orderId: 'order_2'
  }, env)
  assert.equal(releaseResult.success, true)
  assert.equal(releaseResult.data.userCoupon.status, 'unused')
})

test('active higher member level cannot be overwritten by lower level plan', async () => {
  const { handlePromotion } = require('../cloudfunctions/promotion/handler')
  const env = createBasePromotionEnv()

  const yearlyResult = await handlePromotion({ action: 'mockOpenMembership', level: 'yearly' }, env)
  assert.equal(yearlyResult.success, true)
  assert.equal(yearlyResult.data.membership.level, 'yearly')

  const seasonlyResult = await handlePromotion({ action: 'mockOpenMembership', level: 'seasonly' }, env)
  assert.equal(seasonlyResult.success, false)
  assert.equal(seasonlyResult.errorCode, 'MEMBER_PLAN_DOWNGRADE_NOT_ALLOWED')

  const myResult = await handlePromotion({ action: 'getMyMembership' }, env)
  assert.equal(myResult.data.membership.level, 'yearly')
})

test('order creation saves promotion snapshots, payment uses coupon, cancel releases coupon, and finance uses payable amount', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const { calculateFinance } = require('../cloudfunctions/finance/handler')
  const couponCalls = []
  const orders = createMemoryOrders()
  const env = {
    openid: 'openid_user',
    now: fixedNow,
    addresses: {
      async findById() {
        return {
          _id: 'addr_1',
          user_id: 'openid_user',
          contact_name: '张三',
          phone: '13800138000',
          city: '杭州',
          community: '未来小区',
          detail_address: '1幢101'
        }
      }
    },
    services: {
      async findById() {
        return {
          _id: 'svc_clean',
          name: '日常保洁',
          duration: '2小时',
          category_id: 'cleaning',
          category_name: '保洁',
          price: 10000
        }
      }
    },
    orders,
    messages: { async create(data) { return data } },
    promotion: {
      async calculateOrderPromotion(payload) {
        assert.equal(payload.payable_amount, undefined)
        return {
          success: true,
          data: {
            original_amount: 10000,
            member_discount_amount: 500,
            coupon_discount_amount: 1000,
            total_discount_amount: 1500,
            payable_amount: 8500,
            promotion_source: 'member_and_coupon',
            member_snapshot: { level: 'monthly', discount_rate: 0.95, member_plan_id: 'monthly' },
            coupon_snapshot: { user_coupon_id: 'coupon_1', coupon_name: '满100减10' }
          }
        }
      },
      async lockCouponForOrder(payload) {
        couponCalls.push(['lock', payload.orderId])
        return { success: true }
      },
      async useCouponForOrder(payload) {
        couponCalls.push(['use', payload.orderId])
        return { success: true }
      },
      async releaseCouponForOrder(payload) {
        couponCalls.push(['release', payload.orderId])
        return { success: true }
      }
    }
  }

  const createResult = await handleOrder({
    action: 'createOrder',
    serviceId: 'svc_clean',
    addressId: 'addr_1',
    appointment_date: '2026-06-02',
    appointment_slot: '09:00-11:00',
    userCouponId: 'coupon_1',
    payable_amount: 1
  }, env)
  assert.equal(createResult.success, true)
  assert.equal(createResult.data.order.price, 10000)
  assert.equal(createResult.data.order.pay_amount, 8500)
  assert.equal(createResult.data.order.total_discount_amount, 1500)
  assert.equal(createResult.data.order.coupon_snapshot.user_coupon_id, 'coupon_1')
  assert.deepEqual(couponCalls[0], ['lock', createResult.data.order._id])

  const payResult = await handleOrder({
    action: 'mockPayOrder',
    orderId: createResult.data.order._id
  }, env)
  assert.equal(payResult.success, true)
  assert.deepEqual(couponCalls[1], ['use', createResult.data.order._id])
  assert.equal(calculateFinance(payResult.data.order).paidAmount, 8500)

  const cancelOrder = await env.orders.create({
    ...createResult.data.order,
    _id: 'order_cancel',
    status: 'pending_pay',
    pay_status: 'unpaid'
  })
  const cancelResult = await handleOrder({
    action: 'cancelOrder',
    orderId: cancelOrder._id
  }, env)
  assert.equal(cancelResult.success, true)
  assert.deepEqual(couponCalls[2], ['release', cancelOrder._id])
})

test('order creation falls back without coupon when promotion service is unavailable', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const orders = createMemoryOrders()
  const env = {
    openid: 'openid_user',
    now: fixedNow,
    addresses: {
      async findById() {
        return {
          _id: 'addr_1',
          user_id: 'openid_user',
          contact_name: '张三',
          phone: '13800138000',
          city: '杭州',
          community: '未来小区',
          detail_address: '1幢101'
        }
      }
    },
    services: {
      async findById() {
        return {
          _id: 'svc_clean',
          name: '日常保洁',
          duration: '2小时',
          category_id: 'cleaning',
          category_name: '保洁',
          price: 9900
        }
      }
    },
    orders,
    promotion: {
      async calculateOrderPromotion() {
        throw new Error('cloud function promotion not found')
      }
    }
  }

  const result = await handleOrder({
    action: 'createOrder',
    serviceId: 'svc_clean',
    addressId: 'addr_1',
    appointment_date: '2026-06-02',
    appointment_slot: '09:00-11:00'
  }, env)
  assert.equal(result.success, true)
  assert.equal(result.data.order.price, 9900)
  assert.equal(result.data.order.pay_amount, 9900)
  assert.equal(result.data.order.promotion_source, 'none')
})

test('order creation does not hide promotion business errors as original amount', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const orders = createMemoryOrders()
  const env = {
    openid: 'openid_user',
    now: fixedNow,
    addresses: {
      async findById() {
        return {
          _id: 'addr_1',
          user_id: 'openid_user',
          contact_name: '张三',
          phone: '13800138000',
          city: '杭州',
          community: '未来小区',
          detail_address: '1幢101'
        }
      }
    },
    services: {
      async findById() {
        return {
          _id: 'svc_clean',
          name: '日常保洁',
          duration: '2小时',
          category_id: 'cleaning',
          category_name: '保洁',
          price: 9900
        }
      }
    },
    orders,
    promotion: {
      async calculateOrderPromotion() {
        return {
          success: false,
          errorCode: 'OPENID_MISSING',
          message: '无法获取用户 openid'
        }
      }
    }
  }

  const result = await handleOrder({
    action: 'createOrder',
    serviceId: 'svc_clean',
    addressId: 'addr_1',
    appointment_date: '2026-06-02',
    appointment_slot: '09:00-11:00'
  }, env)
  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'OPENID_MISSING')
  assert.equal(orders.records.length, 0)
})

test('order creation rejects selected coupon when promotion service is unavailable', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const orders = createMemoryOrders()
  const env = {
    openid: 'openid_user',
    now: fixedNow,
    addresses: {
      async findById() {
        return {
          _id: 'addr_1',
          user_id: 'openid_user',
          contact_name: '张三',
          phone: '13800138000',
          city: '杭州',
          community: '未来小区',
          detail_address: '1幢101'
        }
      }
    },
    services: {
      async findById() {
        return {
          _id: 'svc_clean',
          name: '日常保洁',
          duration: '2小时',
          category_id: 'cleaning',
          category_name: '保洁',
          price: 9900
        }
      }
    },
    orders,
    promotion: {
      async calculateOrderPromotion() {
        throw new Error('cloud function promotion not found')
      }
    }
  }

  const result = await handleOrder({
    action: 'createOrder',
    serviceId: 'svc_clean',
    addressId: 'addr_1',
    appointment_date: '2026-06-02',
    appointment_slot: '09:00-11:00',
    userCouponId: 'coupon_1'
  }, env)
  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'PROMOTION_UNAVAILABLE')
  assert.equal(orders.records.length, 0)
})

test('phase 17 frontend, constants, cloud function, and docs are wired', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const constants = read('miniprogram/config/constants.js')
  const status = read('miniprogram/config/status.js')
  const promotionService = read('miniprogram/services/promotion.service.js')
  const profileWxml = read('miniprogram/pages/profile/profile.wxml')
  const orderSubmit = read('miniprogram/pages/order-submit/order-submit.js')
  const orderSubmitWxml = read('miniprogram/pages/order-submit/order-submit.wxml')
  const orderDetailWxml = read('miniprogram/pages/order-detail/order-detail.wxml')
  const dashboardWxml = read('miniprogram/pages/admin/dashboard/dashboard.wxml')
  const report = read('docs/dev-records/17_member-coupon-base.md')
  const index = read('docs/dev-records/index.md')

  for (const route of [
    'pages/member/center/center',
    'pages/coupon/list/list',
    'pages/coupon/receive/receive',
    'pages/admin/member-plan-list/member-plan-list',
    'pages/admin/coupon-template-list/coupon-template-list',
    'pages/admin/coupon-template-edit/coupon-template-edit'
  ]) {
    assert.ok(app.pages.includes(route), `${route} should be registered`)
  }

  assert.match(constants, /PROMOTION: 'promotion'/)
  assert.match(constants, /MEMBER_PLANS: 'member_plans'/)
  assert.match(constants, /USER_COUPONS: 'user_coupons'/)
  assert.match(status, /MEMBER_LEVEL/)
  assert.match(status, /USER_COUPON_STATUS/)
  assert.match(promotionService, /mockOpenMembership/)
  assert.match(promotionService, /receiveCoupon/)
  assert.match(profileWxml, /会员中心/)
  assert.match(profileWxml, /我的优惠券/)
  assert.match(orderSubmit, /promotionService/)
  assert.match(orderSubmitWxml, /会员优惠/)
  assert.match(orderSubmitWxml, /优惠券优惠/)
  assert.match(orderDetailWxml, /实付金额/)
  const dashboardJs = read('miniprogram/pages/admin/dashboard/dashboard.js')
  assert.match(dashboardJs, /优惠券管理/)
  assert.match(dashboardJs, /coupon-template-list\/coupon-template-list/)
  assert.match(report, /member_plans/)
  assert.match(index, /17_member-coupon-base/)
  assert.equal(exists('cloudfunctions/promotion/package.json'), true)
})

test('order to promotion cloud calls preserve user identity with internal source guard', () => {
  const orderIndex = read('cloudfunctions/order/index.js')
  const promotionIndex = read('cloudfunctions/promotion/index.js')

  assert.match(orderIndex, /_internal_openid:\s*wxContext\.OPENID/)
  assert.match(promotionIndex, /wxContext\.SOURCE/)
  assert.match(promotionIndex, /source\.includes\('scf'\)/)
  assert.match(promotionIndex, /event\._internal_openid/)
})
