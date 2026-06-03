const {
  calculateOrderPromotion: calculatePromotion,
} = require("./promotion-calculator");
const { success, fail, serviceError } = require("./_shared/response");
const { getPayload } = require("./_shared/payload");
const { getNow } = require("./_shared/time");

const USER_ROLE = Object.freeze({ ADMIN: "admin" });
const USER_STATUS = Object.freeze({ DISABLED: "disabled" });

const MEMBER_LEVEL = Object.freeze({
  NONE: "none",
  MONTHLY: "monthly",
  SEASONLY: "seasonly",
  YEARLY: "yearly",
});

const MEMBER_LEVEL_RANK = Object.freeze({
  [MEMBER_LEVEL.NONE]: 0,
  [MEMBER_LEVEL.MONTHLY]: 1,
  [MEMBER_LEVEL.SEASONLY]: 2,
  [MEMBER_LEVEL.YEARLY]: 3,
});

const MEMBER_STATUS = Object.freeze({
  INACTIVE: "inactive",
  ACTIVE: "active",
  EXPIRED: "expired",
  DISABLED: "disabled",
});

const COUPON_STATUS = Object.freeze({
  DRAFT: "draft",
  ACTIVE: "active",
  DISABLED: "disabled",
  EXPIRED: "expired",
});

const USER_COUPON_STATUS = Object.freeze({
  UNUSED: "unused",
  USED: "used",
  EXPIRED: "expired",
  LOCKED: "locked",
});

const DEFAULT_MEMBER_PLANS = Object.freeze([
  {
    _id: "member_plan_monthly",
    level: MEMBER_LEVEL.MONTHLY,
    name: "月卡",
    price: 2900,
    duration_days: 30,
    discount_rate: 0.95,
    benefits: ["服务订单 95 折"],
    status: "active",
    sort: 10,
  },
  {
    _id: "member_plan_seasonly",
    level: MEMBER_LEVEL.SEASONLY,
    name: "季卡",
    price: 7900,
    duration_days: 90,
    discount_rate: 0.92,
    benefits: ["服务订单 92 折"],
    status: "active",
    sort: 20,
  },
  {
    _id: "member_plan_yearly",
    level: MEMBER_LEVEL.YEARLY,
    name: "年卡",
    price: 19900,
    duration_days: 365,
    discount_rate: 0.88,
    benefits: ["服务订单 88 折"],
    status: "active",
    sort: 30,
  },
]);

function addDays(date, days) {
  return new Date(date.getTime() + days * 24 * 60 * 60 * 1000);
}

function getMemberLevelRank(level) {
  return MEMBER_LEVEL_RANK[level] || MEMBER_LEVEL_RANK[MEMBER_LEVEL.NONE];
}

function requireOpenid(env = {}) {
  if (!env.openid) throw serviceError("OPENID_MISSING", "无法获取用户 openid");
  return env.openid;
}

async function requireAdmin(env = {}) {
  const user = await env.users.findByOpenid(requireOpenid(env));
  if (!user || user.status === USER_STATUS.DISABLED) {
    throw serviceError("USER_NOT_FOUND", "管理员用户不存在或已禁用");
  }
  if (user.role !== USER_ROLE.ADMIN) {
    throw serviceError("PERMISSION_DENIED", "当前操作需要管理员权限");
  }
  return user;
}

async function listMemberPlans(env = {}) {
  const plans =
    env.memberPlans && env.memberPlans.findAll
      ? await env.memberPlans.findAll()
      : [];
  return (plans.length ? plans : DEFAULT_MEMBER_PLANS)
    .filter((plan) => plan.status !== "disabled")
    .sort((a, b) => Number(a.sort || 0) - Number(b.sort || 0));
}

async function getMemberPlans(event = {}, env = {}) {
  return success({ plans: await listMemberPlans(env) });
}

async function getPlanByLevel(level, env = {}) {
  const plans = await listMemberPlans(env);
  return plans.find((plan) => plan.level === level);
}

async function mockOpenMembership(event = {}, env = {}) {
  const userId = requireOpenid(env);
  const payload = getPayload(event);
  const level = payload.level || MEMBER_LEVEL.MONTHLY;
  const plan = await getPlanByLevel(level, env);
  if (!plan)
    throw serviceError("MEMBER_PLAN_NOT_FOUND", "会员方案不存在或已停用");

  const now = getNow(env);
  const existing = env.memberships.findByUserId
    ? await env.memberships.findByUserId(userId)
    : null;
  const hasActiveExisting =
    existing &&
    existing.status === MEMBER_STATUS.ACTIVE &&
    new Date(existing.expired_at) > now;
  if (
    hasActiveExisting &&
    getMemberLevelRank(existing.level) > getMemberLevelRank(plan.level)
  ) {
    throw serviceError(
      "MEMBER_PLAN_DOWNGRADE_NOT_ALLOWED",
      "当前已有更高等级会员，不能开通较低等级会员",
    );
  }
  const startedAt =
    existing &&
    existing.status === MEMBER_STATUS.ACTIVE &&
    new Date(existing.expired_at) > now
      ? new Date(existing.started_at || now)
      : now;
  const baseExpire =
    existing &&
    existing.status === MEMBER_STATUS.ACTIVE &&
    new Date(existing.expired_at) > now
      ? new Date(existing.expired_at)
      : now;
  const data = {
    user_id: userId,
    member_plan_id: plan._id,
    level: plan.level,
    status: MEMBER_STATUS.ACTIVE,
    discount_rate: plan.discount_rate,
    started_at: startedAt,
    expired_at: addDays(baseExpire, Number(plan.duration_days || 30)),
    last_renewed_at: now,
    source: "mock_open",
    updated_at: now,
  };

  const membership =
    existing && env.memberships.updateById
      ? await env.memberships.updateById(existing._id, data)
      : await env.memberships.create({ ...data, created_at: now });

  return success({ membership, plan });
}

async function getMyMembership(event = {}, env = {}) {
  const userId = requireOpenid(env);
  const now = getNow(env);
  const membership = env.memberships.findByUserId
    ? await env.memberships.findByUserId(userId)
    : null;
  if (
    membership &&
    membership.status === MEMBER_STATUS.ACTIVE &&
    new Date(membership.expired_at) <= now
  ) {
    const expired = env.memberships.updateById
      ? await env.memberships.updateById(membership._id, {
          status: MEMBER_STATUS.EXPIRED,
          updated_at: now,
        })
      : { ...membership, status: MEMBER_STATUS.EXPIRED };
    return success({ membership: expired });
  }
  return success({ membership });
}

function normalizeTemplatePayload(payload = {}, now) {
  return {
    name: `${payload.name || ""}`.trim(),
    type: payload.type || "full_reduction",
    amount: Number(payload.amount || 0),
    discount_rate: Number(payload.discount_rate || 0),
    threshold_amount: Number(payload.threshold_amount || 0),
    max_discount_amount: Number(payload.max_discount_amount || 0),
    total_quantity: Number(payload.total_quantity || 0),
    received_quantity: Number(payload.received_quantity || 0),
    used_quantity: Number(payload.used_quantity || 0),
    per_user_limit: Number(payload.per_user_limit || 1),
    valid_days_after_receive: Number(payload.valid_days_after_receive || 7),
    valid_start_at: payload.valid_start_at || now,
    valid_end_at: payload.valid_end_at || addDays(now, 365),
    applicable_category_ids: Array.isArray(payload.applicable_category_ids)
      ? payload.applicable_category_ids
      : [],
    status: payload.status || COUPON_STATUS.DRAFT,
    updated_at: now,
  };
}

async function adminCreateCouponTemplate(event = {}, env = {}) {
  await requireAdmin(env);
  const now = getNow(env);
  const data = normalizeTemplatePayload(getPayload(event), now);
  if (!data.name) throw serviceError("COUPON_NAME_MISSING", "请填写优惠券名称");
  const template = await env.couponTemplates.create({
    ...data,
    created_at: now,
  });
  return success({ template });
}

async function adminUpdateCouponTemplate(event = {}, env = {}) {
  await requireAdmin(env);
  const payload = getPayload(event);
  if (!payload.couponTemplateId)
    throw serviceError("COUPON_TEMPLATE_ID_MISSING", "缺少优惠券模板 ID");
  const template = await env.couponTemplates.updateById(
    payload.couponTemplateId,
    normalizeTemplatePayload(payload, getNow(env)),
  );
  if (!template)
    throw serviceError("COUPON_TEMPLATE_NOT_FOUND", "优惠券模板不存在");
  return success({ template });
}

async function adminGetCouponTemplates(event = {}, env = {}) {
  await requireAdmin(env);
  return success({ templates: await env.couponTemplates.findAll() });
}

async function adminEnableCouponTemplate(event = {}, env = {}) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const template = await env.couponTemplates.updateById(
    payload.couponTemplateId,
    {
      status: COUPON_STATUS.ACTIVE,
      updated_at: getNow(env),
    },
  );
  if (!template)
    throw serviceError("COUPON_TEMPLATE_NOT_FOUND", "优惠券模板不存在");
  return success({ template });
}

async function adminDisableCouponTemplate(event = {}, env = {}) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const template = await env.couponTemplates.updateById(
    payload.couponTemplateId,
    {
      status: COUPON_STATUS.DISABLED,
      updated_at: getNow(env),
    },
  );
  if (!template)
    throw serviceError("COUPON_TEMPLATE_NOT_FOUND", "优惠券模板不存在");
  return success({ template });
}

async function getReceivableCoupons(event = {}, env = {}) {
  const templates = env.couponTemplates.findActive
    ? await env.couponTemplates.findActive()
    : (await env.couponTemplates.findAll()).filter(
        (item) => item.status === COUPON_STATUS.ACTIVE,
      );
  return success({ templates });
}

function isTemplateReceivable(template = {}, now) {
  if (template.status !== COUPON_STATUS.ACTIVE) return false;
  if (
    template.total_quantity &&
    Number(template.received_quantity || 0) >= Number(template.total_quantity)
  )
    return false;
  if (template.valid_end_at && new Date(template.valid_end_at) <= now)
    return false;
  return true;
}

async function receiveCoupon(event = {}, env = {}) {
  const userId = requireOpenid(env);
  const payload = getPayload(event);
  const now = getNow(env);
  const template = await env.couponTemplates.findById(payload.couponTemplateId);
  if (!template || !isTemplateReceivable(template, now)) {
    throw serviceError("COUPON_NOT_RECEIVABLE", "优惠券不可领取");
  }

  const owned = env.userCoupons.findByUserAndTemplate
    ? await env.userCoupons.findByUserAndTemplate(userId, template._id)
    : [];
  if (owned.length >= Number(template.per_user_limit || 1)) {
    throw serviceError("COUPON_RECEIVE_LIMIT", "已达到领取上限");
  }

  const validStartAt =
    now > new Date(template.valid_start_at || now)
      ? now
      : new Date(template.valid_start_at || now);
  const userCoupon = await env.userCoupons.create({
    user_id: userId,
    coupon_template_id: template._id,
    coupon_name: template.name,
    type: template.type,
    amount: Number(template.amount || 0),
    discount_rate: Number(template.discount_rate || 0),
    threshold_amount: Number(template.threshold_amount || 0),
    max_discount_amount: Number(template.max_discount_amount || 0),
    applicable_category_ids: template.applicable_category_ids || [],
    status: USER_COUPON_STATUS.UNUSED,
    received_at: now,
    valid_start_at: validStartAt,
    valid_end_at: addDays(
      validStartAt,
      Number(template.valid_days_after_receive || 7),
    ),
    used_at: null,
    used_order_id: "",
    locked_order_id: "",
    created_at: now,
    updated_at: now,
  });

  if (env.couponTemplates.updateById) {
    await env.couponTemplates.updateById(template._id, {
      received_quantity: Number(template.received_quantity || 0) + 1,
      updated_at: now,
    });
  }

  return success({ userCoupon });
}

async function getMyCoupons(event = {}, env = {}) {
  const userId = requireOpenid(env);
  const coupons = await env.userCoupons.findByUserId(userId);
  return success({ coupons });
}

function isCouponValidForOrder(coupon = {}, service = {}, now) {
  if (!coupon || coupon.status !== USER_COUPON_STATUS.UNUSED) return false;
  if (coupon.valid_start_at && new Date(coupon.valid_start_at) > now)
    return false;
  if (coupon.valid_end_at && new Date(coupon.valid_end_at) <= now) return false;
  const categories = coupon.applicable_category_ids || [];
  if (categories.length && !categories.includes(service.category_id))
    return false;
  return true;
}

async function resolveActiveMembership(userId, env) {
  const now = getNow(env);
  return env.memberships.findActiveByUserId
    ? env.memberships.findActiveByUserId(userId, now)
    : null;
}

async function resolveUserCoupon(userId, couponId, service, env) {
  if (!couponId) return null;
  const coupon = await env.userCoupons.findById(couponId);
  if (
    !coupon ||
    coupon.user_id !== userId ||
    !isCouponValidForOrder(coupon, service, getNow(env))
  ) {
    throw serviceError("COUPON_NOT_AVAILABLE", "优惠券不可用");
  }
  return coupon;
}

async function calculateOrderPromotion(event = {}, env = {}) {
  const userId = requireOpenid(env);
  const payload = getPayload(event);
  const service = payload.service;
  if (!service) throw serviceError("SERVICE_MISSING", "缺少服务信息");
  const membership = await resolveActiveMembership(userId, env);
  const coupon = await resolveUserCoupon(
    userId,
    payload.userCouponId,
    service,
    env,
  );
  const result = calculatePromotion({ service, membership, coupon });
  if (coupon && result.coupon_discount_amount <= 0) {
    throw serviceError("COUPON_NOT_APPLICABLE", "优惠券不满足当前订单使用条件");
  }
  return success(result);
}

async function getAvailableCouponsForOrder(event = {}, env = {}) {
  const userId = requireOpenid(env);
  const payload = getPayload(event);
  const service = payload.service || {};
  const membership = await resolveActiveMembership(userId, env);
  const coupons = await env.userCoupons.findByUserId(userId);
  const availableCoupons = coupons.filter((coupon) => {
    if (!isCouponValidForOrder(coupon, service, getNow(env))) return false;
    return (
      calculatePromotion({ service, membership, coupon })
        .coupon_discount_amount > 0
    );
  });
  return success({ coupons: availableCoupons });
}

async function lockCouponForOrder(event = {}, env = {}) {
  const userId = requireOpenid(env);
  const payload = getPayload(event);
  if (!payload.userCouponId) return success({ userCoupon: null });
  const coupon = await env.userCoupons.findById(payload.userCouponId);
  if (
    coupon &&
    coupon.status === USER_COUPON_STATUS.LOCKED &&
    coupon.locked_order_id === payload.orderId
  ) {
    return success({ already_locked: true, userCoupon: coupon });
  }
  const userCoupon = env.userCoupons.lockUnusedCoupon
    ? await env.userCoupons.lockUnusedCoupon(
        payload.userCouponId,
        userId,
        payload.orderId,
        { updated_at: getNow(env) },
      )
    : await env.userCoupons.updateById(payload.userCouponId, {
        status: USER_COUPON_STATUS.LOCKED,
        locked_order_id: payload.orderId,
        updated_at: getNow(env),
      });
  if (!userCoupon) throw serviceError("COUPON_LOCK_FAILED", "优惠券锁定失败");
  return success({ userCoupon });
}

async function useCouponForOrder(event = {}, env = {}) {
  const payload = getPayload(event);
  if (!payload.userCouponId) return success({ userCoupon: null });
  const coupon = await env.userCoupons.findById(payload.userCouponId);
  if (
    coupon &&
    coupon.status === USER_COUPON_STATUS.USED &&
    coupon.used_order_id === payload.orderId
  ) {
    return success({ already_used: true, userCoupon: coupon });
  }
  const userCoupon = env.userCoupons.useLockedCoupon
    ? await env.userCoupons.useLockedCoupon(
        payload.userCouponId,
        payload.orderId,
        {
          used_at: getNow(env),
          updated_at: getNow(env),
        },
      )
    : await env.userCoupons.updateById(payload.userCouponId, {
        status: USER_COUPON_STATUS.USED,
        used_at: getNow(env),
        used_order_id: payload.orderId,
        updated_at: getNow(env),
      });
  if (!userCoupon) throw serviceError("COUPON_USE_FAILED", "优惠券核销失败");
  return success({ userCoupon });
}

async function releaseCouponForOrder(event = {}, env = {}) {
  const payload = getPayload(event);
  if (!payload.userCouponId) return success({ userCoupon: null });
  const coupon = await env.userCoupons.findById(payload.userCouponId);
  if (
    coupon &&
    coupon.status === USER_COUPON_STATUS.UNUSED &&
    !coupon.locked_order_id
  ) {
    return success({ already_released: true, userCoupon: coupon });
  }
  const userCoupon = env.userCoupons.releaseLockedCoupon
    ? await env.userCoupons.releaseLockedCoupon(
        payload.userCouponId,
        payload.orderId,
        { updated_at: getNow(env) },
      )
    : await env.userCoupons.updateById(payload.userCouponId, {
        status: USER_COUPON_STATUS.UNUSED,
        locked_order_id: "",
        updated_at: getNow(env),
      });
  if (!userCoupon)
    throw serviceError("COUPON_RELEASE_FAILED", "优惠券释放失败");
  return success({ userCoupon });
}

async function adminGetMemberPlans(event = {}, env = {}) {
  await requireAdmin(env);
  return getMemberPlans(event, env);
}

async function adminUpdateMemberPlan(event = {}, env = {}) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const plan = await env.memberPlans.updateById(payload.memberPlanId, {
    status: payload.status,
    updated_at: getNow(env),
  });
  if (!plan) throw serviceError("MEMBER_PLAN_NOT_FOUND", "会员方案不存在");
  return success({ plan });
}

const actions = Object.freeze({
  getMemberPlans,
  mockOpenMembership,
  getMyMembership,
  adminGetMemberPlans,
  adminUpdateMemberPlan,
  adminCreateCouponTemplate,
  adminUpdateCouponTemplate,
  adminGetCouponTemplates,
  adminEnableCouponTemplate,
  adminDisableCouponTemplate,
  getReceivableCoupons,
  receiveCoupon,
  getMyCoupons,
  getAvailableCouponsForOrder,
  calculateOrderPromotion,
  lockCouponForOrder,
  useCouponForOrder,
  releaseCouponForOrder,
});

async function handlePromotion(event = {}, env = {}) {
  const action = actions[event.action];
  if (!action) return fail("ACTION_NOT_FOUND", "未知营销操作");
  try {
    return await action(event, env);
  } catch (error) {
    return fail(
      error.errorCode || "INTERNAL_ERROR",
      error.message || "营销操作失败",
    );
  }
}

module.exports = {
  handlePromotion,
  getMemberPlans,
  mockOpenMembership,
  getMyMembership,
  adminCreateCouponTemplate,
  receiveCoupon,
  getMyCoupons,
  calculateOrderPromotion,
  lockCouponForOrder,
  useCouponForOrder,
  releaseCouponForOrder,
  MEMBER_LEVEL,
  MEMBER_STATUS,
  COUPON_STATUS,
  USER_COUPON_STATUS,
  DEFAULT_MEMBER_PLANS,
};
