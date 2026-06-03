const DEFAULT_TIP_COMMISSION_RATE = 0.15;
const MIN_TIP_AMOUNT = 100;
const MAX_TIP_AMOUNT = 20000;

const USER_STATUS = Object.freeze({ DISABLED: "disabled" });
const USER_ROLE = Object.freeze({ ADMIN: "admin" });
const ORDER_STATUS = Object.freeze({ COMPLETED: "completed" });
const PAY_STATUS = Object.freeze({ PAID: "paid" });

const { success, fail, serviceError } = require("./_shared/response");
const { getPayload } = require("./_shared/payload");
const { getNow } = require("./_shared/time");
const { paginateList } = require("./_shared/pagination");

const TIP_STATUS = Object.freeze({
  MOCK_SUCCESS: "mock_success",
  SUCCESS: "success",
  FAILED: "failed",
  REVERSED: "reversed",
});

const TIP_CHANNEL = Object.freeze({
  MOCK: "mock",
  WECHAT: "wechat",
});

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

function createTipNo(env = {}) {
  if (env.tipNoFactory) return env.tipNoFactory();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `TP${Date.now()}${random}`;
}

function createFinanceNo(env = {}) {
  if (env.financeNoFactory) return env.financeNoFactory();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `FN${Date.now()}${random}`;
}

function createEarningNo(env = {}) {
  if (env.earningNoFactory) return env.earningNoFactory();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `EN${Date.now()}${random}`;
}

function normalizeAmount(value) {
  const amount = Number(value);
  if (
    !Number.isInteger(amount) ||
    amount < MIN_TIP_AMOUNT ||
    amount > MAX_TIP_AMOUNT
  ) {
    throw serviceError("TIP_AMOUNT_INVALID", "打赏金额必须为 1 元到 200 元");
  }
  return amount;
}

function calculateTipAmount(amount, rate = DEFAULT_TIP_COMMISSION_RATE) {
  const platformTipCommission = Math.round(amount * rate);
  return {
    amount,
    commissionRate: rate,
    platformTipCommission,
    workerTipIncome: Math.max(amount - platformTipCommission, 0),
  };
}

async function safeCreateMessage(env, data) {
  if (!env.messages || !env.messages.create) return null;
  try {
    return await env.messages.create({
      role: "worker",
      related_type: "tip",
      is_read: false,
      ...data,
    });
  } catch (error) {
    return null;
  }
}

async function requireTippableOrder(orderId, env) {
  if (!orderId) throw serviceError("ORDER_ID_MISSING", "缺少订单 ID");
  const order = await env.orders.findById(orderId);
  if (!order) throw serviceError("ORDER_NOT_FOUND", "订单不存在");
  if (order.user_id !== requireOpenid(env))
    throw serviceError("PERMISSION_DENIED", "无权打赏该订单");
  if (
    order.status !== ORDER_STATUS.COMPLETED ||
    order.pay_status !== PAY_STATUS.PAID
  ) {
    throw serviceError(
      "ORDER_STATUS_INVALID",
      "只有已完成且已支付订单可以打赏",
    );
  }
  if (!order.worker_id)
    throw serviceError("ORDER_WORKER_MISSING", "订单没有师傅，不能打赏");
  if (order.refund_status && order.refund_status !== "none") {
    throw serviceError("ORDER_AFTER_SALE_INVALID", "退款订单不能打赏");
  }
  if (order.after_sale_status && order.after_sale_status !== "none") {
    throw serviceError("ORDER_AFTER_SALE_INVALID", "售后中订单不能打赏");
  }
  return order;
}

async function createTipFinance(env, tip, order) {
  const now = getNow(env);
  const financeNo = createFinanceNo(env);
  await env.financeLogs.create({
    finance_no: financeNo,
    order_id: order._id,
    order_no: order.order_no || "",
    tip_id: tip._id,
    user_id: order.user_id,
    worker_id: order.worker_id,
    type: "tip_platform_commission",
    direction: "in",
    amount: tip.platform_tip_commission,
    paid_amount: tip.amount,
    platform_commission_amount: tip.platform_tip_commission,
    worker_earning_amount: tip.worker_tip_income,
    source: "mock_tip",
    status: "success",
    remark: "平台打赏抽佣",
    created_at: now,
    updated_at: now,
    created_by: env.openid || "system",
  });
  await env.financeLogs.create({
    finance_no: financeNo,
    order_id: order._id,
    order_no: order.order_no || "",
    tip_id: tip._id,
    user_id: order.user_id,
    worker_id: order.worker_id,
    type: "tip_worker_earning",
    direction: "out",
    amount: tip.worker_tip_income,
    paid_amount: tip.amount,
    platform_commission_amount: tip.platform_tip_commission,
    worker_earning_amount: tip.worker_tip_income,
    source: "mock_tip",
    status: "success",
    remark: "师傅打赏收益",
    created_at: now,
    updated_at: now,
    created_by: env.openid || "system",
  });

  const existing = env.workerEarnings.findActiveByTipId
    ? await env.workerEarnings.findActiveByTipId(tip._id)
    : null;
  if (existing) return existing;

  return env.workerEarnings.create({
    earning_no: createEarningNo(env),
    earning_type: "tip",
    source_type: "tip",
    tip_id: tip._id,
    order_id: order._id,
    order_no: order.order_no || "",
    user_id: order.user_id,
    worker_id: order.worker_id,
    service_name: order.service_name || "",
    appointment_time: order.appointment_time || "",
    order_amount: Number(order.price || 0),
    paid_amount: tip.amount,
    commission_rate: tip.commission_rate,
    commission_rate_bps: Math.round(tip.commission_rate * 10000),
    platform_commission_amount: tip.platform_tip_commission,
    worker_earning_amount: tip.worker_tip_income,
    status: "frozen",
    settlement_status: "not_settled",
    freeze_days: 3,
    frozen_until: new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000),
    settled_at: null,
    reversed_at: null,
    refund_id: "",
    refund_amount: 0,
    remark: "模拟打赏后生成",
    created_at: now,
    updated_at: now,
  });
}

async function createMockTip(event = {}, env = {}) {
  const payload = getPayload(event);
  const order = await requireTippableOrder(payload.orderId, env);
  const existingTips = env.tipLogs.findByOrderId
    ? await env.tipLogs.findByOrderId(order._id)
    : [];
  if (existingTips.some((tip) => tip.status !== TIP_STATUS.REVERSED)) {
    throw serviceError("TIP_ALREADY_EXISTS", "该订单已打赏");
  }

  const now = getNow(env);
  const amounts = calculateTipAmount(
    normalizeAmount(payload.amount),
    DEFAULT_TIP_COMMISSION_RATE,
  );
  const tip = await env.tipLogs.create({
    tip_no: createTipNo(env),
    order_id: order._id,
    order_no: order.order_no || "",
    user_id: order.user_id,
    worker_id: order.worker_id,
    amount: amounts.amount,
    worker_tip_income: amounts.workerTipIncome,
    platform_tip_commission: amounts.platformTipCommission,
    commission_rate: amounts.commissionRate,
    status: TIP_STATUS.MOCK_SUCCESS,
    channel: TIP_CHANNEL.MOCK,
    finance_generated: false,
    finance_generated_at: null,
    created_at: now,
    updated_at: now,
  });

  const workerEarning = await createTipFinance(env, tip, order);
  const updatedTip = await env.tipLogs.updateById(tip._id, {
    finance_generated: true,
    finance_generated_at: now,
    updated_at: now,
  });

  await safeCreateMessage(env, {
    user_id: order.worker_id,
    title: "收到用户打赏",
    content: "用户已完成模拟打赏，可在收益中查看",
    type: "tip_created",
    related_id: order._id,
    created_at: now,
    updated_at: now,
  });

  return success({ tip: updatedTip || tip, workerEarning });
}

async function getUserTipList(event = {}, env = {}) {
  const tips = await env.tipLogs.findByUserId(requireOpenid(env));
  return success(paginateList(tips, getPayload(event), { listKey: "tips" }));
}

async function getWorkerTipList(event = {}, env = {}) {
  const tips = await env.tipLogs.findByWorkerId(requireOpenid(env));
  return success(paginateList(tips, getPayload(event), { listKey: "tips" }));
}

async function getTipDetail(event = {}, env = {}) {
  const payload = getPayload(event);
  const tip = await env.tipLogs.findById(payload.tipId);
  if (!tip) throw serviceError("TIP_NOT_FOUND", "打赏记录不存在");
  const openid = requireOpenid(env);
  if (tip.user_id !== openid && tip.worker_id !== openid) {
    await requireAdmin(env);
  }
  return success({ tip });
}

async function adminGetTipLogs(event = {}, env = {}) {
  await requireAdmin(env);
  const payload = getPayload(event);
  let tips = await env.tipLogs.findAll();
  if (payload.workerId)
    tips = tips.filter((tip) => tip.worker_id === payload.workerId);
  if (payload.userId)
    tips = tips.filter((tip) => tip.user_id === payload.userId);
  if (payload.status)
    tips = tips.filter((tip) => tip.status === payload.status);
  return success(paginateList(tips, payload, { listKey: "tips" }));
}

const actions = Object.freeze({
  createMockTip,
  getUserTipList,
  getWorkerTipList,
  adminGetTipLogs,
  getTipDetail,
});

async function handleTip(event = {}, env = {}) {
  const action = actions[event.action];
  if (!action) return fail("ACTION_NOT_FOUND", "未知打赏操作");
  try {
    return await action(event, env);
  } catch (error) {
    return fail(
      error.errorCode || "INTERNAL_ERROR",
      error.message || "打赏操作失败",
    );
  }
}

module.exports = {
  handleTip,
  createMockTip,
  getUserTipList,
  getWorkerTipList,
  adminGetTipLogs,
  getTipDetail,
  TIP_STATUS,
  TIP_CHANNEL,
  calculateTipAmount,
};
