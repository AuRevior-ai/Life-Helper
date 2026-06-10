const { mockRefund: runMockRefund, wechatRefund } = require("./refund-adapter");
const { success, fail, serviceError } = require("./_shared/response");
const { getPayload } = require("./_shared/payload");
const { getNow } = require("./_shared/time");
const { normalizePage, buildPageResult } = require("./_shared/pagination");

const USER_STATUS = Object.freeze({
  NORMAL: "normal",
  DISABLED: "disabled",
});

const USER_ROLE = Object.freeze({
  ADMIN: "admin",
});

const ORDER_STATUS = Object.freeze({
  PENDING_PAY: "pending_pay",
  PENDING_ACCEPT: "pending_accept",
  ACCEPTED: "accepted",
  SERVING: "serving",
  PENDING_REVIEW: "pending_review",
  COMPLETED: "completed",
  CANCELED: "canceled",
});

const AFTER_SALE_STATUS = Object.freeze({
  NONE: "none",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELED: "canceled",
  REFUNDED: "refunded",
});

const AFTER_SALE_TYPE = Object.freeze({
  REFUND_ONLY: "refund_only",
  CANCEL_AND_REFUND: "cancel_and_refund",
});

const REFUND_STATUS = Object.freeze({
  NONE: "none",
  PENDING: "pending",
  SUCCESS: "success",
  FAILED: "failed",
  MOCK_SUCCESS: "mock_success",
});

const REFUND_CHANNEL = Object.freeze({
  MOCK: "mock",
  WECHAT: "wechat",
});

const ALLOWED_AFTER_SALE_ORDER_STATUS = Object.freeze([
  ORDER_STATUS.PENDING_ACCEPT,
  ORDER_STATUS.ACCEPTED,
  ORDER_STATUS.SERVING,
  ORDER_STATUS.PENDING_REVIEW,
  ORDER_STATUS.COMPLETED,
]);

function trimText(value) {
  return `${value || ""}`.trim();
}

function requireOpenid(env = {}) {
  if (!env.openid) {
    throw serviceError("OPENID_MISSING", "无法获取用户 openid");
  }
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

function buildPagedSuccess(pageData, pageInfo, listKey) {
  const list = pageData.list || [];
  return success(
    buildPageResult(
      list,
      {
        page: pageData.page || pageInfo.page,
        pageSize: pageData.pageSize || pageInfo.pageSize,
        total: pageData.total || 0,
      },
      { listKey },
    ),
  );
}

function normalizeImages(value) {
  if (!value) return [];
  if (!Array.isArray(value)) {
    throw serviceError("AFTER_SALE_IMAGES_INVALID", "售后凭证图片格式不正确");
  }
  const images = value.map((item) => trimText(item)).filter(Boolean);
  if (images.length > 3) {
    throw serviceError("AFTER_SALE_IMAGES_INVALID", "售后凭证图片最多 3 张");
  }
  return images;
}

function createAfterSaleNo(env = {}) {
  if (env.afterSaleNoFactory) {
    return env.afterSaleNoFactory();
  }
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `AS${Date.now()}${random}`;
}

function createRefundNo(env = {}) {
  if (env.refundNoFactory) {
    return env.refundNoFactory();
  }
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `RF${Date.now()}${random}`;
}

function getOrderAmount(order = {}) {
  return Number(order.pay_amount || order.price || 0);
}

function isAfterSaleAllowed(order = {}) {
  return (
    order.pay_status === "paid" &&
    ALLOWED_AFTER_SALE_ORDER_STATUS.includes(order.status)
  );
}

async function safeCreateMessage(env, data) {
  if (!env.messages || !env.messages.create) {
    return null;
  }

  try {
    return await env.messages.create({
      role: "user",
      related_type: "after_sale",
      is_read: false,
      ...data,
    });
  } catch (error) {
    return null;
  }
}

async function safeReverseOrderFinance(env, payload) {
  if (!env.finance || !env.finance.reverseOrderFinance) {
    return null;
  }

  try {
    return await env.finance.reverseOrderFinance(payload);
  } catch (error) {
    return null;
  }
}

async function createRefundLog(env, data) {
  if (!env.refundLogs || !env.refundLogs.create) {
    throw serviceError("REFUND_LOG_REPOSITORY_MISSING", "缺少退款日志集合");
  }

  const now = getNow(env);
  return env.refundLogs.create({
    ...data,
    created_at: data.created_at || now,
    updated_at: data.updated_at || now,
  });
}

function buildRefundLogData(afterSale, order, refundNo, result = {}) {
  return {
    refund_no: refundNo,
    after_sale_id: afterSale._id,
    order_id: order._id,
    order_no: order.order_no,
    user_id: order.user_id,
    out_trade_no: order.out_trade_no || "",
    transaction_id: order.transaction_id || "",
    amount: getOrderAmount(order),
    refund_amount: afterSale.amount,
    refund_status: result.refund_status,
    refund_channel: result.refund_channel,
    raw_data: result.raw_data || {},
  };
}

async function createAfterSale(event = {}, env = {}) {
  const payload = getPayload(event);
  const userId = requireOpenid(env);
  if (!payload.orderId) {
    throw serviceError("ORDER_ID_MISSING", "缺少订单 ID");
  }

  const order = await env.orders.findById(payload.orderId);
  if (!order) {
    throw serviceError("ORDER_NOT_FOUND", "订单不存在");
  }
  if (order.user_id !== userId) {
    throw serviceError("PERMISSION_DENIED", "无权申请该订单售后");
  }
  if (!isAfterSaleAllowed(order)) {
    throw serviceError("ORDER_AFTER_SALE_NOT_ALLOWED", "当前订单不能申请售后");
  }

  const activeAfterSale = await env.afterSales.findActiveByOrderId(order._id);
  if (activeAfterSale) {
    throw serviceError("AFTER_SALE_EXISTS", "该订单已有进行中的售后申请");
  }

  const reason = trimText(payload.reason);
  if (!reason) {
    throw serviceError("AFTER_SALE_REASON_MISSING", "请填写售后原因");
  }

  const now = getNow(env);
  const afterSale = await env.afterSales.create({
    after_sale_no: createAfterSaleNo(env),
    order_id: order._id,
    order_no: order.order_no,
    user_id: order.user_id,
    worker_id: order.worker_id || "",
    type: payload.type || AFTER_SALE_TYPE.REFUND_ONLY,
    reason,
    description: trimText(payload.description),
    images: normalizeImages(payload.images),
    amount: getOrderAmount(order),
    status: AFTER_SALE_STATUS.PENDING,
    admin_id: "",
    admin_remark: "",
    created_at: now,
    reviewed_at: null,
    refunded_at: null,
    updated_at: now,
  });

  await env.orders.updateById(order._id, {
    after_sale_status: AFTER_SALE_STATUS.PENDING,
    after_sale_id: afterSale._id,
    refund_amount: afterSale.amount,
    updated_at: now,
  });

  await safeCreateMessage(env, {
    user_id: order.user_id,
    title: "售后申请已提交",
    content: "你的售后申请已提交，请等待平台审核",
    type: "after_sale_created",
    related_id: afterSale._id,
    created_at: now,
    updated_at: now,
  });

  return success({ afterSale });
}

async function getUserAfterSaleList(event = {}, env = {}) {
  const userId = requireOpenid(env);
  if (!env.afterSales.queryPage) {
    throw serviceError("AFTER_SALE_REPOSITORY_MISSING", "缺少售后分页查询能力");
  }
  const payload = getPayload(event);
  const filters = { user_id: userId };
  if (payload.status) filters.status = payload.status;
  const pageInfo = normalizePage(payload);
  const pageData = await env.afterSales.queryPage(filters, pageInfo);
  return buildPagedSuccess(pageData, pageInfo, "afterSales");
}

async function getAfterSaleDetail(event = {}, env = {}) {
  const payload = getPayload(event);
  if (!payload.afterSaleId) {
    throw serviceError("AFTER_SALE_ID_MISSING", "缺少售后 ID");
  }

  const afterSale = await env.afterSales.findById(payload.afterSaleId);
  if (!afterSale) {
    throw serviceError("AFTER_SALE_NOT_FOUND", "售后申请不存在");
  }

  const openid = requireOpenid(env);
  const user =
    env.users && env.users.findByOpenid
      ? await env.users.findByOpenid(openid)
      : null;
  if (
    afterSale.user_id !== openid &&
    afterSale.worker_id !== openid &&
    (!user || user.role !== USER_ROLE.ADMIN)
  ) {
    throw serviceError("PERMISSION_DENIED", "无权查看该售后申请");
  }

  const order = await env.orders.findById(afterSale.order_id);
  const refundLogs =
    env.refundLogs && env.refundLogs.findByAfterSaleId
      ? await env.refundLogs.findByAfterSaleId(afterSale._id)
      : [];
  return success({ afterSale, order, refundLogs });
}

async function adminGetAfterSaleList(event = {}, env = {}) {
  await requireAdmin(env);
  const payload = getPayload(event);
  if (!env.afterSales.queryPage) {
    throw serviceError("AFTER_SALE_REPOSITORY_MISSING", "缺少售后分页查询能力");
  }
  const filters = {};
  if (payload.status) filters.status = payload.status;
  const pageInfo = normalizePage(payload);
  const pageData = await env.afterSales.queryPage(filters, pageInfo);
  return buildPagedSuccess(pageData, pageInfo, "afterSales");
}

async function performMockRefund(afterSale, env = {}) {
  const order = await env.orders.findById(afterSale.order_id);
  if (!order) {
    throw serviceError("ORDER_NOT_FOUND", "订单不存在");
  }
  if (
    [REFUND_STATUS.MOCK_SUCCESS, REFUND_STATUS.SUCCESS].includes(
      order.refund_status,
    )
  ) {
    await createRefundLog(env, {
      ...buildRefundLogData(
        afterSale,
        order,
        afterSale.refund_no || createRefundNo(env),
        {
          refund_status: order.refund_status,
          refund_channel: REFUND_CHANNEL.MOCK,
          raw_data: { message: "duplicate refund blocked" },
        },
      ),
      type: "duplicate_refund",
      error_code: "REFUND_ALREADY_PROCESSED",
      error_message: "该订单已退款",
    });
    throw serviceError("REFUND_ALREADY_PROCESSED", "该订单已退款");
  }

  const now = getNow(env);
  const refundNo = afterSale.refund_no || createRefundNo(env);
  const result = await runMockRefund({
    after_sale_id: afterSale._id,
    order_id: order._id,
    refund_no: refundNo,
    amount: afterSale.amount,
  });
  const refundLog = await createRefundLog(env, {
    ...buildRefundLogData(afterSale, order, refundNo, result),
    type: "mock_refund",
  });
  const updatedAfterSale = await env.afterSales.updateById(afterSale._id, {
    status: AFTER_SALE_STATUS.REFUNDED,
    refund_no: refundNo,
    refunded_at: now,
    updated_at: now,
  });
  const updatedOrder = await env.orders.updateById(order._id, {
    after_sale_status: AFTER_SALE_STATUS.REFUNDED,
    refund_status: result.refund_status,
    refund_amount: afterSale.amount,
    refund_no: refundNo,
    refunded_at: now,
    updated_at: now,
  });

  await safeCreateMessage(env, {
    user_id: order.user_id,
    title: "退款已完成",
    content: "平台已完成模拟退款",
    type: "refund_success",
    related_id: afterSale._id,
    created_at: now,
    updated_at: now,
  });

  await safeReverseOrderFinance(env, {
    orderId: order._id,
    refundId: refundLog._id || refundNo,
    refundAmount: afterSale.amount,
  });

  return {
    afterSale: updatedAfterSale,
    order: updatedOrder,
    refundLog,
  };
}

async function adminReviewAfterSale(event = {}, env = {}) {
  const admin = await requireAdmin(env);
  const payload = getPayload(event);
  if (!payload.afterSaleId) {
    throw serviceError("AFTER_SALE_ID_MISSING", "缺少售后 ID");
  }

  const afterSale = await env.afterSales.findById(payload.afterSaleId);
  if (!afterSale) {
    throw serviceError("AFTER_SALE_NOT_FOUND", "售后申请不存在");
  }
  if (afterSale.status !== AFTER_SALE_STATUS.PENDING) {
    throw serviceError("AFTER_SALE_REVIEWED", "售后申请已审核");
  }

  const now = getNow(env);
  const reviewStatus = payload.reviewStatus || payload.status;
  if (reviewStatus === AFTER_SALE_STATUS.REJECTED) {
    const updatedAfterSale = await env.afterSales.updateById(afterSale._id, {
      status: AFTER_SALE_STATUS.REJECTED,
      admin_id: admin.openid || requireOpenid(env),
      admin_remark: trimText(payload.adminRemark || payload.admin_remark),
      reviewed_at: now,
      updated_at: now,
    });
    const order = await env.orders.updateById(afterSale.order_id, {
      after_sale_status: AFTER_SALE_STATUS.REJECTED,
      updated_at: now,
    });
    await safeCreateMessage(env, {
      user_id: afterSale.user_id,
      title: "售后申请未通过",
      content: updatedAfterSale.admin_remark || "售后申请未通过",
      type: "after_sale_rejected",
      related_id: afterSale._id,
      created_at: now,
      updated_at: now,
    });
    return success({ afterSale: updatedAfterSale, order });
  }

  if (reviewStatus !== AFTER_SALE_STATUS.APPROVED) {
    throw serviceError("AFTER_SALE_REVIEW_STATUS_INVALID", "审核状态不合法");
  }

  const approvedAfterSale = await env.afterSales.updateById(afterSale._id, {
    status: AFTER_SALE_STATUS.APPROVED,
    admin_id: admin.openid || requireOpenid(env),
    admin_remark: trimText(payload.adminRemark || payload.admin_remark),
    reviewed_at: now,
    updated_at: now,
  });
  await env.orders.updateById(afterSale.order_id, {
    after_sale_status: AFTER_SALE_STATUS.APPROVED,
    refund_status: REFUND_STATUS.PENDING,
    updated_at: now,
  });
  await safeCreateMessage(env, {
    user_id: afterSale.user_id,
    title: "售后申请已通过",
    content: "平台已通过售后申请，正在处理退款",
    type: "after_sale_approved",
    related_id: afterSale._id,
    created_at: now,
    updated_at: now,
  });

  const refundResult = await performMockRefund(approvedAfterSale, env);
  return success(refundResult);
}

async function mockRefund(event = {}, env = {}) {
  await requireAdmin(env);
  const payload = getPayload(event);
  if (!payload.afterSaleId) {
    throw serviceError("AFTER_SALE_ID_MISSING", "缺少售后 ID");
  }

  const afterSale = await env.afterSales.findById(payload.afterSaleId);
  if (!afterSale) {
    throw serviceError("AFTER_SALE_NOT_FOUND", "售后申请不存在");
  }
  if (
    ![AFTER_SALE_STATUS.APPROVED, AFTER_SALE_STATUS.REFUNDED].includes(
      afterSale.status,
    )
  ) {
    throw serviceError("AFTER_SALE_STATUS_INVALID", "当前售后状态不能退款");
  }

  return success(await performMockRefund(afterSale, env));
}

async function getRefundLogs(event = {}, env = {}) {
  const payload = getPayload(event);
  if (!payload.afterSaleId) {
    throw serviceError("AFTER_SALE_ID_MISSING", "缺少售后 ID");
  }
  const afterSale = await env.afterSales.findById(payload.afterSaleId);
  if (!afterSale) {
    throw serviceError("AFTER_SALE_NOT_FOUND", "售后申请不存在");
  }
  const openid = requireOpenid(env);
  const user =
    env.users && env.users.findByOpenid
      ? await env.users.findByOpenid(openid)
      : null;
  if (
    afterSale.user_id !== openid &&
    (!user || user.role !== USER_ROLE.ADMIN)
  ) {
    throw serviceError("PERMISSION_DENIED", "无权查看退款日志");
  }
  const logs = await env.refundLogs.findByAfterSaleId(afterSale._id);
  return success({ logs });
}

const actions = Object.freeze({
  createAfterSale,
  getUserAfterSaleList,
  getAfterSaleDetail,
  adminGetAfterSaleList,
  adminReviewAfterSale,
  mockRefund,
  getRefundLogs,
});

async function handleRefund(event = {}, env = {}) {
  const action = actions[event.action];
  if (!action) {
    return fail("ACTION_NOT_FOUND", "未知售后退款操作");
  }

  try {
    return await action(event, env);
  } catch (error) {
    return fail(
      error.errorCode || "INTERNAL_ERROR",
      error.message || "售后退款操作失败",
    );
  }
}

module.exports = {
  handleRefund,
  createAfterSale,
  getUserAfterSaleList,
  getAfterSaleDetail,
  adminGetAfterSaleList,
  adminReviewAfterSale,
  mockRefund,
  getRefundLogs,
  wechatRefund,
  AFTER_SALE_STATUS,
  REFUND_STATUS,
};
