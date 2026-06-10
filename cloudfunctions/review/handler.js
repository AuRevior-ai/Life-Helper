const { success, fail, serviceError } = require("./_shared/response");
const { getPayload } = require("./_shared/payload");
const { getNow } = require("./_shared/time");
const { normalizePage, buildPageResult } = require("./_shared/pagination");

function trimText(value) {
  return `${value || ""}`.trim();
}

const USER_STATUS = Object.freeze({ DISABLED: "disabled" });
const USER_ROLE = Object.freeze({ ADMIN: "admin" });

const REVIEW_STATUS = Object.freeze({
  VISIBLE: "visible",
  HIDDEN: "hidden",
  DELETED: "deleted",
});

const REVIEW_RATING_LEVEL = Object.freeze({
  GOOD: "good",
  NEUTRAL: "neutral",
  BAD: "bad",
});

const REVIEW_APPEAL_STATUS = Object.freeze({
  NONE: "none",
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
  CANCELED: "canceled",
});

const REVIEW_ACTION_TYPE = Object.freeze({
  CREATE_REVIEW: "create_review",
  ADD_FOLLOWUP: "add_followup",
  WORKER_REPLY: "worker_reply",
  HIDE_REVIEW: "hide_review",
  RESTORE_REVIEW: "restore_review",
  APPEAL_CREATE: "appeal_create",
  APPEAL_APPROVE: "appeal_approve",
  APPEAL_REJECT: "appeal_reject",
});

function getRatingLevel(rating) {
  if (rating >= 4) return REVIEW_RATING_LEVEL.GOOD;
  if (rating === 3) return REVIEW_RATING_LEVEL.NEUTRAL;
  return REVIEW_RATING_LEVEL.BAD;
}

function normalizeStringArray(value, limit, errorCode, message) {
  if (!value) return [];
  if (!Array.isArray(value)) throw serviceError(errorCode, message);
  const items = value.map((item) => trimText(item)).filter(Boolean);
  if (items.length > limit) throw serviceError(errorCode, message);
  return items;
}

async function safeCreateMessage(env, data) {
  if (!env.messages || !env.messages.create) {
    return null;
  }

  try {
    return await env.messages.create({
      role: "worker",
      related_type: "order",
      is_read: false,
      ...data,
    });
  } catch (error) {
    return null;
  }
}

async function safeCreateReviewActionLog(env, data) {
  if (!env.reviewActionLogs || !env.reviewActionLogs.create) return null;
  try {
    return await env.reviewActionLogs.create({
      reason: "",
      remark: "",
      created_at: getNow(env),
      ...data,
    });
  } catch (error) {
    return null;
  }
}

async function safeGenerateOrderFinance(env, orderId) {
  if (!env.finance || !env.finance.generateOrderFinance) {
    return null;
  }

  try {
    return await env.finance.generateOrderFinance({
      orderId,
      source: "mock_payment",
    });
  } catch (error) {
    return null;
  }
}

function requireOpenid(env) {
  if (!env.openid) {
    throw serviceError("OPENID_MISSING", "无法获取用户 openid");
  }
  return env.openid;
}

async function requireAdmin(env) {
  if (!env.users || !env.users.findByOpenid) {
    throw serviceError("USER_REPOSITORY_MISSING", "缺少用户集合");
  }
  const openid = requireOpenid(env);
  const user = await env.users.findByOpenid(openid);
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

function normalizeRating(value) {
  const rating = Number(value);
  if (!Number.isInteger(rating) || rating < 1 || rating > 5) {
    throw serviceError("REVIEW_RATING_INVALID", "评分必须为 1-5 分");
  }
  return rating;
}

async function requireReviewableOrder(orderId, env) {
  if (!orderId) {
    throw serviceError("ORDER_ID_MISSING", "缺少订单 ID");
  }

  const order = await env.orders.findById(orderId);
  if (!order) {
    throw serviceError("ORDER_NOT_FOUND", "订单不存在");
  }

  if (order.user_id !== requireOpenid(env)) {
    throw serviceError("PERMISSION_DENIED", "无权评价该订单");
  }

  if (order.status !== "pending_review") {
    throw serviceError("ORDER_STATUS_INVALID", "当前订单不能评价");
  }

  return order;
}

async function createReview(event, env) {
  const payload = getPayload(event);
  const order = await requireReviewableOrder(payload.orderId, env);
  const existingReview = await env.reviews.findByOrderId(order._id);
  if (existingReview) {
    throw serviceError("REVIEW_ALREADY_EXISTS", "该订单已评价");
  }

  const now = getNow(env);
  const rating = normalizeRating(payload.rating);
  const review = await env.reviews.create({
    order_id: order._id,
    order_no: order.order_no || "",
    user_id: order.user_id,
    worker_id: order.worker_id,
    service_id: order.service_id,
    service_name: order.service_name,
    rating,
    rating_level: getRatingLevel(rating),
    tags: normalizeStringArray(
      payload.tags,
      10,
      "REVIEW_TAGS_INVALID",
      "评价标签格式不正确",
    ),
    content: trimText(payload.content),
    images: normalizeStringArray(
      payload.images,
      3,
      "REVIEW_IMAGES_INVALID",
      "评价图片最多 3 张",
    ),
    is_anonymous: payload.is_anonymous === true || payload.isAnonymous === true,
    followup_content: "",
    followup_images: [],
    followup_at: null,
    worker_reply_content: "",
    worker_reply_at: null,
    status: REVIEW_STATUS.VISIBLE,
    hidden_reason: "",
    hidden_by: "",
    hidden_at: null,
    appeal_status: REVIEW_APPEAL_STATUS.NONE,
    appeal_id: "",
    created_at: now,
    updated_at: now,
  });
  if (!review) {
    throw serviceError("REVIEW_ALREADY_EXISTS", "该订单已评价");
  }

  const completeData = {
    status: "completed",
    reviewed_at: now,
    updated_at: now,
  };
  const updatedOrder = env.orders.completePendingReviewOrder
    ? await env.orders.completePendingReviewOrder(order._id, completeData)
    : await env.orders.updateById(order._id, completeData);

  if (!updatedOrder) {
    if (env.reviews.deleteById && review._id) {
      await env.reviews.deleteById(review._id);
    }
    throw serviceError("ORDER_STATUS_INVALID", "订单状态已变化，评价未完成");
  }

  await safeCreateMessage(env, {
    user_id: order.worker_id,
    title: "用户已完成评价",
    content: "用户已完成评价，订单已完成",
    type: "review_created",
    related_id: order._id,
    created_at: now,
    updated_at: now,
  });

  await safeCreateReviewActionLog(env, {
    review_id: review._id,
    order_id: order._id,
    order_no: order.order_no || "",
    action: REVIEW_ACTION_TYPE.CREATE_REVIEW,
    operator_id: order.user_id,
    operator_role: "user",
    from_status: "",
    to_status: REVIEW_STATUS.VISIBLE,
  });

  await safeGenerateOrderFinance(env, order._id);

  return success({
    review,
    order: updatedOrder,
  });
}

async function requireReviewById(reviewId, env) {
  if (!reviewId) throw serviceError("REVIEW_ID_MISSING", "缺少评价 ID");
  const review = env.reviews.findById
    ? await env.reviews.findById(reviewId)
    : null;
  if (!review) throw serviceError("REVIEW_NOT_FOUND", "评价不存在");
  return review;
}

async function requireCompletedOrder(orderId, env) {
  const order = await env.orders.findById(orderId);
  if (!order) throw serviceError("ORDER_NOT_FOUND", "订单不存在");
  if (order.status !== "completed") {
    throw serviceError("ORDER_STATUS_INVALID", "订单未完成");
  }
  return order;
}

async function addReviewFollowup(event, env) {
  const payload = getPayload(event);
  const review = await requireReviewById(payload.reviewId, env);
  const openid = requireOpenid(env);
  if (review.user_id !== openid)
    throw serviceError("PERMISSION_DENIED", "无权追评该评价");
  if (review.followup_content || review.followup_at) {
    throw serviceError("REVIEW_FOLLOWUP_EXISTS", "该评价已追评");
  }
  const content = trimText(payload.content || payload.followupContent);
  if (!content) throw serviceError("REVIEW_FOLLOWUP_MISSING", "请填写追评内容");
  await requireCompletedOrder(review.order_id, env);

  const now = getNow(env);
  const updated = await env.reviews.updateById(review._id, {
    followup_content: content,
    followup_images: normalizeStringArray(
      payload.images || payload.followupImages,
      3,
      "REVIEW_IMAGES_INVALID",
      "追评图片最多 3 张",
    ),
    followup_at: now,
    updated_at: now,
  });

  await safeCreateMessage(env, {
    user_id: review.worker_id,
    title: "用户追加了评价",
    content: "用户追加了评价，请查看",
    type: "review_followup_added",
    related_id: review.order_id,
    created_at: now,
    updated_at: now,
  });
  await safeCreateReviewActionLog(env, {
    review_id: review._id,
    order_id: review.order_id,
    order_no: review.order_no || "",
    action: REVIEW_ACTION_TYPE.ADD_FOLLOWUP,
    operator_id: openid,
    operator_role: "user",
    from_status: review.status || REVIEW_STATUS.VISIBLE,
    to_status: updated.status || REVIEW_STATUS.VISIBLE,
  });

  return success({ review: updated });
}

async function workerReplyReview(event, env) {
  const payload = getPayload(event);
  const review = await requireReviewById(payload.reviewId, env);
  const openid = requireOpenid(env);
  if (review.worker_id !== openid)
    throw serviceError("PERMISSION_DENIED", "无权回复该评价");
  if ((review.status || REVIEW_STATUS.VISIBLE) !== REVIEW_STATUS.VISIBLE) {
    throw serviceError("REVIEW_STATUS_INVALID", "当前评价不可回复");
  }
  if (review.worker_reply_content || review.worker_reply_at) {
    throw serviceError("REVIEW_REPLY_EXISTS", "该评价已回复");
  }
  const content = trimText(payload.content || payload.replyContent);
  if (!content) throw serviceError("REVIEW_REPLY_MISSING", "请填写回复内容");
  const now = getNow(env);
  const updated = await env.reviews.updateById(review._id, {
    worker_reply_content: content,
    worker_reply_at: now,
    updated_at: now,
  });
  await safeCreateMessage(env, {
    user_id: review.user_id,
    role: "user",
    title: "师傅回复了评价",
    content: "师傅回复了你的评价",
    type: "worker_review_reply",
    related_id: review.order_id,
    created_at: now,
    updated_at: now,
  });
  await safeCreateReviewActionLog(env, {
    review_id: review._id,
    order_id: review.order_id,
    order_no: review.order_no || "",
    action: REVIEW_ACTION_TYPE.WORKER_REPLY,
    operator_id: openid,
    operator_role: "worker",
    from_status: review.status || REVIEW_STATUS.VISIBLE,
    to_status: updated.status || REVIEW_STATUS.VISIBLE,
  });
  return success({ review: updated });
}

function createAppealNo(env = {}) {
  if (env.appealNoFactory) return env.appealNoFactory();
  const random = Math.floor(Math.random() * 100000)
    .toString()
    .padStart(5, "0");
  return `RA${Date.now()}${random}`;
}

async function workerCreateReviewAppeal(event, env) {
  const payload = getPayload(event);
  const review = await requireReviewById(payload.reviewId, env);
  const openid = requireOpenid(env);
  if (review.worker_id !== openid)
    throw serviceError("PERMISSION_DENIED", "无权申诉该评价");
  if (
    (review.status || REVIEW_STATUS.VISIBLE) !== REVIEW_STATUS.VISIBLE ||
    review.status === REVIEW_STATUS.DELETED
  ) {
    throw serviceError("REVIEW_STATUS_INVALID", "当前评价不可申诉");
  }
  const isBad =
    review.rating_level === REVIEW_RATING_LEVEL.BAD ||
    Number(review.rating || 0) <= 2;
  if (!isBad)
    throw serviceError("REVIEW_APPEAL_NOT_ALLOWED", "只有差评可以申诉");
  const reason = trimText(payload.reason);
  if (!reason)
    throw serviceError("REVIEW_APPEAL_REASON_MISSING", "请填写申诉理由");
  const existing =
    env.reviewAppeals && env.reviewAppeals.findPendingByReviewId
      ? await env.reviewAppeals.findPendingByReviewId(review._id)
      : null;
  if (existing)
    throw serviceError("REVIEW_APPEAL_PENDING", "该评价已有待处理申诉");

  const now = getNow(env);
  const appeal = await env.reviewAppeals.create({
    appeal_no: createAppealNo(env),
    review_id: review._id,
    order_id: review.order_id,
    order_no: review.order_no || "",
    worker_id: review.worker_id,
    user_id: review.user_id,
    reason,
    description: trimText(payload.description),
    images: normalizeStringArray(
      payload.images,
      3,
      "REVIEW_APPEAL_IMAGES_INVALID",
      "申诉图片最多 3 张",
    ),
    status: REVIEW_APPEAL_STATUS.PENDING,
    admin_id: "",
    admin_remark: "",
    reviewed_at: null,
    created_at: now,
    updated_at: now,
  });
  const updated = await env.reviews.updateById(review._id, {
    appeal_status: REVIEW_APPEAL_STATUS.PENDING,
    appeal_id: appeal._id,
    updated_at: now,
  });
  await safeCreateMessage(env, {
    user_id: review.worker_id,
    title: "差评申诉已提交",
    content: "差评申诉已提交，等待平台审核",
    type: "review_appeal_created",
    related_id: review.order_id,
    created_at: now,
    updated_at: now,
  });
  await safeCreateReviewActionLog(env, {
    review_id: review._id,
    order_id: review.order_id,
    order_no: review.order_no || "",
    action: REVIEW_ACTION_TYPE.APPEAL_CREATE,
    operator_id: openid,
    operator_role: "worker",
    from_status: review.appeal_status || REVIEW_APPEAL_STATUS.NONE,
    to_status: REVIEW_APPEAL_STATUS.PENDING,
    reason,
  });
  return success({ appeal, review: updated });
}

async function adminHideReview(event, env) {
  const admin = await requireAdmin(env);
  const payload = getPayload(event);
  const reason = trimText(payload.reason);
  if (!reason)
    throw serviceError("REVIEW_HIDE_REASON_MISSING", "请填写隐藏原因");
  const review = await requireReviewById(payload.reviewId, env);
  const now = getNow(env);
  const updated = await env.reviews.updateById(review._id, {
    status: REVIEW_STATUS.HIDDEN,
    hidden_reason: reason,
    hidden_by: admin.openid || requireOpenid(env),
    hidden_at: now,
    updated_at: now,
  });
  await safeCreateReviewActionLog(env, {
    review_id: review._id,
    order_id: review.order_id,
    order_no: review.order_no || "",
    action: REVIEW_ACTION_TYPE.HIDE_REVIEW,
    operator_id: admin.openid || requireOpenid(env),
    operator_role: "admin",
    from_status: review.status || REVIEW_STATUS.VISIBLE,
    to_status: REVIEW_STATUS.HIDDEN,
    reason,
  });
  return success({ review: updated });
}

async function adminRestoreReview(event, env) {
  const admin = await requireAdmin(env);
  const payload = getPayload(event);
  const reason = trimText(payload.reason);
  if (!reason)
    throw serviceError("REVIEW_RESTORE_REASON_MISSING", "请填写恢复原因");
  const review = await requireReviewById(payload.reviewId, env);
  const now = getNow(env);
  const updated = await env.reviews.updateById(review._id, {
    status: REVIEW_STATUS.VISIBLE,
    hidden_reason: "",
    hidden_by: "",
    hidden_at: null,
    updated_at: now,
  });
  await safeCreateReviewActionLog(env, {
    review_id: review._id,
    order_id: review.order_id,
    order_no: review.order_no || "",
    action: REVIEW_ACTION_TYPE.RESTORE_REVIEW,
    operator_id: admin.openid || requireOpenid(env),
    operator_role: "admin",
    from_status: review.status || REVIEW_STATUS.HIDDEN,
    to_status: REVIEW_STATUS.VISIBLE,
    reason,
  });
  return success({ review: updated });
}

async function adminReviewAppeal(event, env) {
  const admin = await requireAdmin(env);
  const payload = getPayload(event);
  const appeal = await env.reviewAppeals.findById(payload.appealId);
  if (!appeal) throw serviceError("REVIEW_APPEAL_NOT_FOUND", "申诉不存在");
  if (appeal.status !== REVIEW_APPEAL_STATUS.PENDING) {
    throw serviceError("REVIEW_APPEAL_STATUS_INVALID", "当前申诉不可处理");
  }
  const adminRemark = trimText(payload.adminRemark || payload.remark);
  if (!adminRemark)
    throw serviceError("REVIEW_APPEAL_REMARK_MISSING", "请填写审核备注");
  const approved =
    payload.result === REVIEW_APPEAL_STATUS.APPROVED ||
    payload.status === REVIEW_APPEAL_STATUS.APPROVED;
  const rejected =
    payload.result === REVIEW_APPEAL_STATUS.REJECTED ||
    payload.status === REVIEW_APPEAL_STATUS.REJECTED;
  if (!approved && !rejected)
    throw serviceError("REVIEW_APPEAL_RESULT_INVALID", "申诉处理结果不合法");

  const now = getNow(env);
  const nextStatus = approved
    ? REVIEW_APPEAL_STATUS.APPROVED
    : REVIEW_APPEAL_STATUS.REJECTED;
  const updatedAppeal = await env.reviewAppeals.updateById(appeal._id, {
    status: nextStatus,
    admin_id: admin.openid || requireOpenid(env),
    admin_remark: adminRemark,
    reviewed_at: now,
    updated_at: now,
  });
  const review = await requireReviewById(appeal.review_id, env);
  const updatedReview = await env.reviews.updateById(review._id, {
    status: approved ? REVIEW_STATUS.HIDDEN : REVIEW_STATUS.VISIBLE,
    appeal_status: nextStatus,
    hidden_reason: approved ? "appeal approved" : "",
    hidden_by: approved ? admin.openid || requireOpenid(env) : "",
    hidden_at: approved ? now : null,
    updated_at: now,
  });
  await safeCreateMessage(env, {
    user_id: appeal.worker_id,
    title: approved ? "差评申诉已通过" : "差评申诉未通过",
    content: adminRemark,
    type: approved ? "review_appeal_approved" : "review_appeal_rejected",
    related_id: appeal.order_id,
    created_at: now,
    updated_at: now,
  });
  await safeCreateReviewActionLog(env, {
    review_id: review._id,
    order_id: review.order_id,
    order_no: review.order_no || "",
    action: approved
      ? REVIEW_ACTION_TYPE.APPEAL_APPROVE
      : REVIEW_ACTION_TYPE.APPEAL_REJECT,
    operator_id: admin.openid || requireOpenid(env),
    operator_role: "admin",
    from_status: REVIEW_APPEAL_STATUS.PENDING,
    to_status: nextStatus,
    remark: adminRemark,
  });
  return success({ appeal: updatedAppeal, review: updatedReview });
}

async function getOrderReview(event, env) {
  const payload = getPayload(event);
  if (!payload.orderId) {
    throw serviceError("ORDER_ID_MISSING", "缺少订单 ID");
  }

  const review = await env.reviews.findByOrderId(payload.orderId);
  return success({ review });
}

async function getReviewDetail(event, env) {
  const payload = getPayload(event);
  const review = await requireReviewById(payload.reviewId, env);
  const openid = requireOpenid(env);
  if (review.user_id !== openid && review.worker_id !== openid) {
    if (!env.users) throw serviceError("PERMISSION_DENIED", "无权查看该评价");
    await requireAdmin(env);
  }
  const appeals =
    env.reviewAppeals && env.reviewAppeals.findByReviewId
      ? await env.reviewAppeals.findByReviewId(review._id)
      : [];
  return success({ review, appeals });
}

async function getWorkerReviews(event, env) {
  const payload = getPayload(event);
  const workerId = trimText(payload.workerId || requireOpenid(env));
  if (!env.reviews.queryPage) {
    throw serviceError("REVIEW_REPOSITORY_MISSING", "缺少评价分页查询能力");
  }
  const pageInfo = normalizePage(payload);
  const pageData = await env.reviews.queryPage({ worker_id: workerId }, pageInfo);
  return buildPagedSuccess(pageData, pageInfo, "reviews");
}

async function getWorkerReviewList(event, env) {
  const payload = getPayload(event);
  if (!env.reviews.queryPage) {
    throw serviceError("REVIEW_REPOSITORY_MISSING", "缺少评价分页查询能力");
  }
  const pageInfo = normalizePage(payload);
  const pageData = await env.reviews.queryPage(
    { worker_id: requireOpenid(env) },
    pageInfo,
  );
  return buildPagedSuccess(pageData, pageInfo, "reviews");
}

async function adminGetReviewList(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  if (!env.reviews.queryPage) {
    throw serviceError("REVIEW_REPOSITORY_MISSING", "缺少评价分页查询能力");
  }
  const filters = {};
  if (payload.status) filters.status = payload.status;
  if (payload.ratingLevel) filters.rating_level = payload.ratingLevel;
  if (payload.badOnly) filters.bad_only = true;
  const pageInfo = normalizePage(payload);
  const pageData = await env.reviews.queryPage(filters, pageInfo);
  return buildPagedSuccess(pageData, pageInfo, "reviews");
}

async function adminGetReviewDetail(event, env) {
  await requireAdmin(env);
  return getReviewDetail(event, env);
}

async function adminGetReviewAppealList(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  let appeals = await env.reviewAppeals.findAll();
  if (payload.status)
    appeals = appeals.filter((appeal) => appeal.status === payload.status);
  return success({ appeals });
}

async function adminGetReviewAppealDetail(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const appeal = await env.reviewAppeals.findById(payload.appealId);
  if (!appeal) throw serviceError("REVIEW_APPEAL_NOT_FOUND", "申诉不存在");
  const review = await env.reviews.findById(appeal.review_id);
  return success({ appeal, review });
}

const actions = Object.freeze({
  createReview,
  getOrderReview,
  getReviewDetail,
  addReviewFollowup,
  workerReplyReview,
  workerCreateReviewAppeal,
  adminHideReview,
  adminRestoreReview,
  adminReviewAppeal,
  adminGetReviewList,
  adminGetReviewDetail,
  adminGetReviewAppealList,
  adminGetReviewAppealDetail,
  getWorkerReviewList,
  getWorkerReviews,
});

async function handleReview(event = {}, env) {
  const action = actions[event.action];
  if (!action) {
    return fail("ACTION_NOT_FOUND", "未知评价操作");
  }

  try {
    return await action(event, env);
  } catch (error) {
    return fail(
      error.errorCode || "INTERNAL_ERROR",
      error.message || "评价操作失败",
    );
  }
}

module.exports = {
  handleReview,
  createReview,
  getOrderReview,
  getReviewDetail,
  addReviewFollowup,
  workerReplyReview,
  workerCreateReviewAppeal,
  adminHideReview,
  adminRestoreReview,
  adminReviewAppeal,
  adminGetReviewList,
  adminGetReviewDetail,
  adminGetReviewAppealList,
  adminGetReviewAppealDetail,
  getWorkerReviewList,
  getWorkerReviews,
  REVIEW_STATUS,
  REVIEW_RATING_LEVEL,
  REVIEW_APPEAL_STATUS,
  REVIEW_ACTION_TYPE,
};
