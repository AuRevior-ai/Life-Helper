const SERVICE_PROVIDER_TYPE = Object.freeze({
  WORKER: "worker",
  MERCHANT: "merchant",
});

const MERCHANT_AUDIT_STATUS = Object.freeze({
  PENDING: "pending",
  APPROVED: "approved",
  REJECTED: "rejected",
});

const MERCHANT_STATUS = Object.freeze({
  NORMAL: "normal",
  DISABLED: "disabled",
});

const MERCHANT_SERVICE_STATUS = Object.freeze({
  ON: "on",
  OFF: "off",
});

const ORDER_STATUS = Object.freeze({
  PENDING_ACCEPT: "pending_accept",
  ACCEPTED: "accepted",
  SERVING: "serving",
  PENDING_REVIEW: "pending_review",
});

const USER_ROLE = Object.freeze({
  ADMIN: "admin",
});

const USER_STATUS = Object.freeze({
  NORMAL: "normal",
  DISABLED: "disabled",
});

const { success, fail, serviceError } = require("./_shared/response");
const { getPayload } = require("./_shared/payload");
const { getNow } = require("./_shared/time");
const { normalizePage, buildPageResult } = require("./_shared/pagination");
const {
  canMerchantOperate,
  assertCanMerchantOperate,
} = require("./onboarding.service");
const { sortProvidersByDistance } = require("./_shared/lbs-utils");

function trimText(value) {
  return `${value || ""}`.trim();
}

function toNumberOrNull(value) {
  if (value === null || value === undefined || value === "") return null;
  const number = Number(value);
  return Number.isFinite(number) ? number : null;
}

function normalizeArray(value) {
  return Array.isArray(value)
    ? value.map((item) => trimText(item)).filter(Boolean)
    : [];
}

function requireOpenid(env = {}) {
  if (!env.openid) throw serviceError("OPENID_MISSING", "无法获取用户 openid");
  return env.openid;
}

function requireText(value, errorCode, message) {
  const text = trimText(value);
  if (!text) throw serviceError(errorCode, message);
  return text;
}

function isPhone(value) {
  return /^1[3-9]\d{9}$/.test(trimText(value));
}

async function requireCurrentUser(env = {}) {
  const user = await env.users.findByOpenid(requireOpenid(env));
  if (!user || user.status === USER_STATUS.DISABLED) {
    throw serviceError("USER_NOT_FOUND", "用户不存在或已禁用");
  }
  return user;
}

async function requireAdmin(env = {}) {
  const user = await requireCurrentUser(env);
  if (user.role !== USER_ROLE.ADMIN)
    throw serviceError("PERMISSION_DENIED", "当前操作需要管理员权限");
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

async function requireMerchantById(merchantId, env = {}) {
  if (!merchantId) throw serviceError("MERCHANT_ID_MISSING", "缺少商家 ID");
  const merchant = await env.merchants.findById(merchantId);
  if (!merchant) throw serviceError("MERCHANT_NOT_FOUND", "商家不存在");
  return merchant;
}

async function requireOwnedApprovedMerchant(env = {}) {
  const merchant = await env.merchants.findByUserId(requireOpenid(env));
  if (!merchant) throw serviceError("MERCHANT_NOT_FOUND", "商家不存在");
  if (merchant.audit_status !== MERCHANT_AUDIT_STATUS.APPROVED) {
    throw serviceError("MERCHANT_NOT_APPROVED", "商家尚未通过审核");
  }
  return merchant;
}

async function createMerchantLog(env, data) {
  if (!env.merchantLogs || !env.merchantLogs.create) return null;
  try {
    return env.merchantLogs.create({
      operator_id: env.openid || "",
      operator_role: data.operator_role || "merchant",
      reason: "",
      remark: "",
      related_type: "merchant",
      related_id: data.merchant_id || "",
      created_at: getNow(env),
      ...data,
    });
  } catch (error) {
    return null;
  }
}

async function safeCreateMessage(env, data) {
  if (!env.messages || !env.messages.create) return null;
  try {
    return env.messages.create({
      role: "merchant",
      related_type: "merchant",
      is_read: false,
      created_at: getNow(env),
      updated_at: getNow(env),
      ...data,
    });
  } catch (error) {
    return null;
  }
}

function normalizeMerchantPayload(payload = {}) {
  return {
    store_name: trimText(payload.storeName || payload.store_name),
    store_logo: trimText(payload.storeLogo || payload.store_logo),
    store_cover: trimText(payload.storeCover || payload.store_cover),
    store_intro: trimText(payload.storeIntro || payload.store_intro),
    contact_name: trimText(payload.contactName || payload.contact_name),
    contact_phone: trimText(payload.contactPhone || payload.contact_phone),
    business_license_image: trimText(
      payload.businessLicenseImage || payload.business_license_image,
    ),
    qualification_images: normalizeArray(
      payload.qualificationImages || payload.qualification_images,
    ),
    service_category_ids: normalizeArray(
      payload.serviceCategoryIds || payload.service_category_ids,
    ),
    service_area_ids: normalizeArray(
      payload.serviceAreaIds || payload.service_area_ids,
    ),
    service_communities: normalizeArray(
      payload.serviceCommunities || payload.service_communities,
    ),
    city: trimText(payload.city),
    district: trimText(payload.district),
    street: trimText(payload.street),
    community: trimText(payload.community),
    service_range_mode:
      trimText(payload.serviceRangeMode || payload.service_range_mode) ||
      "admin_area",
    base_latitude: toNumberOrNull(
      payload.baseLatitude || payload.base_latitude || payload.latitude,
    ),
    base_longitude: toNumberOrNull(
      payload.baseLongitude || payload.base_longitude || payload.longitude,
    ),
    base_address: trimText(payload.baseAddress || payload.base_address),
    base_poi_name: trimText(payload.basePoiName || payload.base_poi_name),
    service_radius_km: Number(
      payload.serviceRadiusKm || payload.service_radius_km || 0,
    ),
    service_districts: normalizeArray(
      payload.serviceDistricts || payload.service_districts,
    ),
    service_streets: normalizeArray(
      payload.serviceStreets || payload.service_streets,
    ),
    service_adcodes: normalizeArray(
      payload.serviceAdcodes || payload.service_adcodes,
    ),
    lbs_enabled: payload.lbsEnabled === true || payload.lbs_enabled === true,
    location_updated_at:
      payload.locationUpdatedAt || payload.location_updated_at || null,
    detail_address: trimText(payload.detailAddress || payload.detail_address),
    full_address: trimText(payload.fullAddress || payload.full_address),
    business_hours: trimText(payload.businessHours || payload.business_hours),
    announcement: trimText(payload.announcement),
  };
}

function validateMerchantPayload(payload) {
  if (!payload.store_name || !payload.contact_name || !payload.contact_phone) {
    throw serviceError("MERCHANT_REQUIRED", "请填写完整商家入驻信息");
  }
  if (!isPhone(payload.contact_phone)) {
    throw serviceError("MERCHANT_PHONE_INVALID", "手机号格式不正确");
  }
}

async function applyMerchant(event, env) {
  const userId = requireOpenid(env);
  const existing = await env.merchants.findByUserId(userId);
  if (existing)
    throw serviceError("MERCHANT_ALREADY_APPLIED", "一个账号只能申请一个商家");

  const payload = normalizeMerchantPayload(getPayload(event));
  validateMerchantPayload(payload);

  const now = getNow(env);
  const merchant = await env.merchants.create({
    ...payload,
    user_id: userId,
    audit_status: MERCHANT_AUDIT_STATUS.PENDING,
    status: MERCHANT_STATUS.DISABLED,
    reject_reason: "",
    rating_avg: 0,
    completed_order_count: 0,
    review_count: 0,
    created_at: now,
    updated_at: now,
  });
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    action: "apply",
    operator_role: "merchant",
    to_status: MERCHANT_AUDIT_STATUS.PENDING,
    related_id: merchant._id,
  });
  return success({ merchant });
}

async function getMyMerchantInfo(event, env) {
  const merchant = await env.merchants.findByUserId(requireOpenid(env));
  return success({ merchant });
}

async function getMerchantAuditStatus(event, env) {
  const merchant = await env.merchants.findByUserId(requireOpenid(env));
  return success({
    audit_status: merchant ? merchant.audit_status : "not_applied",
    merchant: merchant || null,
  });
}

async function upsertMerchantProvider(merchant, env) {
  const now = getNow(env);
  const data = {
    provider_type: SERVICE_PROVIDER_TYPE.MERCHANT,
    ref_id: merchant._id,
    user_id: merchant.user_id,
    display_name: merchant.store_name,
    avatar: merchant.store_logo || "",
    phone: merchant.contact_phone || "",
    service_category_ids: merchant.service_category_ids || [],
    service_area_ids: merchant.service_area_ids || [],
    service_communities: merchant.service_communities || [],
    service_range_mode: merchant.service_range_mode || "admin_area",
    base_latitude: merchant.base_latitude ?? null,
    base_longitude: merchant.base_longitude ?? null,
    base_address: merchant.base_address || "",
    base_poi_name: merchant.base_poi_name || "",
    service_radius_km: Number(merchant.service_radius_km || 0),
    service_city: merchant.city || "",
    service_districts:
      merchant.service_districts ||
      (merchant.district ? [merchant.district] : []),
    service_streets:
      merchant.service_streets || (merchant.street ? [merchant.street] : []),
    service_adcodes: merchant.service_adcodes || [],
    lbs_enabled: merchant.lbs_enabled === true,
    location_updated_at: merchant.location_updated_at || null,
    audit_status: merchant.audit_status,
    status: merchant.status,
    online_status: "available",
    rating_avg: Number(merchant.rating_avg || 0),
    completed_order_count: Number(merchant.completed_order_count || 0),
    updated_at: now,
  };
  if (env.serviceProviders.upsertByRef) {
    return env.serviceProviders.upsertByRef(
      SERVICE_PROVIDER_TYPE.MERCHANT,
      merchant._id,
      data,
    );
  }
  const existing = await env.serviceProviders.findByRef(
    SERVICE_PROVIDER_TYPE.MERCHANT,
    merchant._id,
  );
  if (existing) return env.serviceProviders.updateById(existing._id, data);
  return env.serviceProviders.create({ ...data, created_at: now });
}

async function adminApproveMerchant(event, env) {
  await requireAdmin(env);
  const merchant = await requireMerchantById(getPayload(event).merchantId, env);
  const now = getNow(env);
  const updated = await env.merchants.updateById(merchant._id, {
    audit_status: MERCHANT_AUDIT_STATUS.APPROVED,
    status: MERCHANT_STATUS.NORMAL,
    reviewer_id: requireOpenid(env),
    approved_at: now,
    updated_at: now,
  });
  const provider = await upsertMerchantProvider(updated, env);
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    provider_id: provider._id,
    action: "approve",
    operator_role: "admin",
    from_status: merchant.audit_status,
    to_status: MERCHANT_AUDIT_STATUS.APPROVED,
    related_id: merchant._id,
  });
  await safeCreateMessage(env, {
    user_id: merchant.user_id,
    title: "商家入驻审核通过",
    content: "你的商家入驻申请已通过",
    type: "merchant_approved",
    related_id: merchant._id,
  });
  return success({ merchant: updated, provider });
}

async function adminRejectMerchant(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const merchant = await requireMerchantById(payload.merchantId, env);
  const reason = trimText(payload.reason) || "资料不完整";
  const now = getNow(env);
  const updated = await env.merchants.updateById(merchant._id, {
    audit_status: MERCHANT_AUDIT_STATUS.REJECTED,
    status: MERCHANT_STATUS.DISABLED,
    reject_reason: reason,
    reviewer_id: requireOpenid(env),
    rejected_at: now,
    updated_at: now,
  });
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    action: "reject",
    operator_role: "admin",
    from_status: merchant.audit_status,
    to_status: MERCHANT_AUDIT_STATUS.REJECTED,
    reason,
    related_id: merchant._id,
  });
  await safeCreateMessage(env, {
    user_id: merchant.user_id,
    title: "商家入驻审核未通过",
    content: reason,
    type: "merchant_rejected",
    related_id: merchant._id,
  });
  return success({ merchant: updated });
}

async function adminEnableMerchant(event, env) {
  await requireAdmin(env);
  const merchant = await requireMerchantById(getPayload(event).merchantId, env);
  const updated = await env.merchants.updateById(merchant._id, {
    status: MERCHANT_STATUS.NORMAL,
    updated_at: getNow(env),
  });
  const provider = await upsertMerchantProvider(updated, env);
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    provider_id: provider._id,
    action: "enable",
    operator_role: "admin",
    from_status: merchant.status,
    to_status: MERCHANT_STATUS.NORMAL,
    related_id: merchant._id,
  });
  return success({ merchant: updated, provider });
}

async function adminDisableMerchant(event, env) {
  await requireAdmin(env);
  const merchant = await requireMerchantById(getPayload(event).merchantId, env);
  const updated = await env.merchants.updateById(merchant._id, {
    status: MERCHANT_STATUS.DISABLED,
    updated_at: getNow(env),
  });
  const provider = await upsertMerchantProvider(updated, env);
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    provider_id: provider._id,
    action: "disable",
    operator_role: "admin",
    from_status: merchant.status,
    to_status: MERCHANT_STATUS.DISABLED,
    related_id: merchant._id,
  });
  return success({ merchant: updated, provider });
}

async function createMerchantService(event, env) {
  const merchant = await requireOwnedApprovedMerchant(env);
  if (merchant.status !== MERCHANT_STATUS.NORMAL)
    throw serviceError("MERCHANT_DISABLED", "商家已被禁用");
  if (env.qualifications && env.deposits && env.riskRecords) {
    const operationGate = await canMerchantOperate(
      {
        merchantId: merchant._id,
        providerType: SERVICE_PROVIDER_TYPE.MERCHANT,
      },
      env,
    );
    assertCanMerchantOperate(operationGate);
  }
  const payload = getPayload(event);
  const serviceId = requireText(
    payload.serviceId || payload.service_id,
    "SERVICE_ID_MISSING",
    "缺少服务 ID",
  );
  const service = await env.services.findById(serviceId);
  if (!service) throw serviceError("SERVICE_NOT_FOUND", "服务不存在");
  const provider = env.serviceProviders.findByRef
    ? await env.serviceProviders.findByRef(
        SERVICE_PROVIDER_TYPE.MERCHANT,
        merchant._id,
      )
    : null;
  const now = getNow(env);
  const merchantService = await env.merchantServices.create({
    merchant_id: merchant._id,
    provider_id: provider ? provider._id : "",
    service_id: service._id,
    service_name: service.name,
    category_id: service.category_id || "",
    category_name: service.category_name || "",
    price: Number(payload.price || service.price || 0),
    duration: service.duration || "",
    description: trimText(payload.description) || service.description || "",
    cover_image:
      trimText(payload.coverImage || payload.cover_image) ||
      service.cover_image ||
      "",
    status: MERCHANT_SERVICE_STATUS.ON,
    sort: Number(payload.sort || 0),
    created_at: now,
    updated_at: now,
  });
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    provider_id: merchantService.provider_id,
    action: "update_service",
    related_type: "service",
    related_id: merchantService._id,
  });
  return success({ merchantService });
}

async function requireOwnedMerchantService(merchantServiceId, merchant, env) {
  const merchantService =
    await env.merchantServices.findById(merchantServiceId);
  if (!merchantService)
    throw serviceError("MERCHANT_SERVICE_NOT_FOUND", "商家服务不存在");
  if (merchantService.merchant_id !== merchant._id)
    throw serviceError("PERMISSION_DENIED", "无权操作该服务");
  return merchantService;
}

async function updateMerchantServiceStatus(event, env, status) {
  const merchant = await requireOwnedApprovedMerchant(env);
  const payload = getPayload(event);
  const merchantService = await requireOwnedMerchantService(
    payload.merchantServiceId || payload.merchant_service_id,
    merchant,
    env,
  );
  const updated = await env.merchantServices.updateById(merchantService._id, {
    status,
    updated_at: getNow(env),
  });
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    provider_id: merchantService.provider_id,
    action: "update_service",
    from_status: merchantService.status,
    to_status: status,
    related_type: "service",
    related_id: merchantService._id,
  });
  return success({ merchantService: updated });
}

async function enableMerchantService(event, env) {
  return updateMerchantServiceStatus(event, env, MERCHANT_SERVICE_STATUS.ON);
}

async function disableMerchantService(event, env) {
  return updateMerchantServiceStatus(event, env, MERCHANT_SERVICE_STATUS.OFF);
}

async function getMerchantServiceList(event, env) {
  const merchant = await requireOwnedApprovedMerchant(env);
  const services = await env.merchantServices.findByMerchantId(merchant._id);
  return success({ list: services, services });
}

function ensurePublicMerchant(merchant) {
  if (
    !merchant ||
    merchant.audit_status !== MERCHANT_AUDIT_STATUS.APPROVED ||
    merchant.status !== MERCHANT_STATUS.NORMAL
  ) {
    throw serviceError("MERCHANT_NOT_AVAILABLE", "商家暂不可用");
  }
}

async function getStoreList(event, env) {
  const payload = getPayload(event);
  const merchants = await env.merchants.findAll();
  let list = merchants.filter(
    (merchant) =>
      merchant.audit_status === MERCHANT_AUDIT_STATUS.APPROVED &&
      merchant.status === MERCHANT_STATUS.NORMAL,
  );
  if (payload.latitude !== undefined && payload.longitude !== undefined) {
    list = sortProvidersByDistance(
      { latitude: payload.latitude, longitude: payload.longitude },
      list,
    );
  }
  return success({ list, merchants: list });
}

async function getStoreDetail(event, env) {
  const payload = getPayload(event);
  let merchantId = payload.merchantId || payload.merchant_id;
  let selectedService = null;
  const merchantServiceId =
    payload.merchantServiceId || payload.merchant_service_id;
  if (!merchantId && merchantServiceId) {
    selectedService = await env.merchantServices.findById(merchantServiceId);
    if (!selectedService)
      throw serviceError("MERCHANT_SERVICE_NOT_FOUND", "商家服务不存在");
    merchantId = selectedService.merchant_id;
  }
  const merchant = await requireMerchantById(merchantId, env);
  ensurePublicMerchant(merchant);
  const services = (
    await env.merchantServices.findByMerchantId(merchant._id)
  ).filter((service) => service.status === MERCHANT_SERVICE_STATUS.ON);
  return success({
    merchant,
    services,
    service: selectedService || null,
  });
}

async function getStoreServices(event, env) {
  const result = await getStoreDetail(event, env);
  return success({
    services: result.data.services,
    list: result.data.services,
  });
}

async function requireOwnedMerchantOrder(orderId, merchant, env) {
  const order = await env.orders.findById(orderId);
  if (!order) throw serviceError("ORDER_NOT_FOUND", "订单不存在");
  if (
    order.provider_type !== SERVICE_PROVIDER_TYPE.MERCHANT ||
    order.merchant_id !== merchant._id
  ) {
    throw serviceError("PERMISSION_DENIED", "无权操作该商家订单");
  }
  return order;
}

async function getMerchantOrderList(event, env) {
  const merchant = await requireOwnedApprovedMerchant(env);
  const payload = getPayload(event);
  if (!env.orders.queryPage) {
    throw serviceError("ORDER_REPOSITORY_MISSING", "缺少商家订单分页查询能力");
  }
  const filters = {
    merchant_id: merchant._id,
    provider_type: SERVICE_PROVIDER_TYPE.MERCHANT,
  };
  if (payload.status) filters.status = payload.status;
  const pageInfo = normalizePage(payload);
  const pageData = await env.orders.queryPage(filters, pageInfo);
  return buildPagedSuccess(pageData, pageInfo, "orders");
}

async function getMerchantOrderDetail(event, env) {
  const merchant = await requireOwnedApprovedMerchant(env);
  const order = await requireOwnedMerchantOrder(
    getPayload(event).orderId,
    merchant,
    env,
  );
  return success({ order });
}

async function merchantAcceptOrder(event, env) {
  const merchant = await requireOwnedApprovedMerchant(env);
  if (merchant.status !== MERCHANT_STATUS.NORMAL)
    throw serviceError("MERCHANT_DISABLED", "商家已被禁用");
  const order = await requireOwnedMerchantOrder(
    getPayload(event).orderId,
    merchant,
    env,
  );
  if (order.status !== ORDER_STATUS.PENDING_ACCEPT)
    throw serviceError("ORDER_STATUS_INVALID", "当前订单不能接单");
  const now = getNow(env);
  const updated = await env.orders.updateById(order._id, {
    status: ORDER_STATUS.ACCEPTED,
    accepted_at: now,
    updated_at: now,
  });
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    provider_id: order.provider_id || "",
    action: "accept_order",
    from_status: order.status,
    to_status: ORDER_STATUS.ACCEPTED,
    related_type: "order",
    related_id: order._id,
  });
  await safeCreateMessage(env, {
    user_id: order.user_id,
    title: "商家已接单",
    content: "商家已接单，请保持电话畅通",
    type: "merchant_order_accepted",
    related_type: "order",
    related_id: order._id,
  });
  return success({ order: updated });
}

async function merchantStartService(event, env) {
  const merchant = await requireOwnedApprovedMerchant(env);
  const order = await requireOwnedMerchantOrder(
    getPayload(event).orderId,
    merchant,
    env,
  );
  if (order.status !== ORDER_STATUS.ACCEPTED)
    throw serviceError("ORDER_STATUS_INVALID", "当前订单不能开始服务");
  const now = getNow(env);
  const updated = await env.orders.updateById(order._id, {
    status: ORDER_STATUS.SERVING,
    started_at: now,
    updated_at: now,
  });
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    provider_id: order.provider_id || "",
    action: "start_service",
    from_status: order.status,
    to_status: ORDER_STATUS.SERVING,
    related_type: "order",
    related_id: order._id,
  });
  await safeCreateMessage(env, {
    user_id: order.user_id,
    title: "商家已开始服务",
    content: "商家已开始服务",
    type: "merchant_service_started",
    related_type: "order",
    related_id: order._id,
  });
  return success({ order: updated });
}

function normalizeFinishImages(value) {
  if (!value) return [];
  if (!Array.isArray(value))
    throw serviceError("FINISH_IMAGES_INVALID", "完工图片格式不正确");
  const images = value.map((item) => trimText(item)).filter(Boolean);
  if (images.length > 3)
    throw serviceError("FINISH_IMAGES_INVALID", "完工图片最多 3 张");
  return images;
}

async function merchantFinishService(event, env) {
  const merchant = await requireOwnedApprovedMerchant(env);
  const payload = getPayload(event);
  const order = await requireOwnedMerchantOrder(payload.orderId, merchant, env);
  if (order.status !== ORDER_STATUS.SERVING)
    throw serviceError("ORDER_STATUS_INVALID", "当前订单不能完成服务");
  const finishRemark = requireText(
    payload.finishRemark || payload.finish_remark,
    "FINISH_REMARK_MISSING",
    "请填写完工说明",
  );
  const finishImages = normalizeFinishImages(
    payload.finishImages || payload.finish_images,
  );
  const now = getNow(env);
  const updated = await env.orders.updateById(order._id, {
    status: ORDER_STATUS.PENDING_REVIEW,
    finish_remark: finishRemark,
    finish_images: finishImages,
    finished_at: now,
    updated_at: now,
  });
  await createMerchantLog(env, {
    merchant_id: merchant._id,
    provider_id: order.provider_id || "",
    action: "finish_service",
    from_status: order.status,
    to_status: ORDER_STATUS.PENDING_REVIEW,
    related_type: "order",
    related_id: order._id,
  });
  await safeCreateMessage(env, {
    user_id: order.user_id,
    title: "商家服务已完成",
    content: "商家服务已完成，请确认并评价",
    type: "merchant_service_finished",
    related_type: "order",
    related_id: order._id,
  });
  return success({ order: updated });
}

async function adminGetMerchantList(event, env) {
  await requireAdmin(env);
  return success({ list: await env.merchants.findAll() });
}

async function adminGetMerchantDetail(event, env) {
  await requireAdmin(env);
  const merchant = await requireMerchantById(getPayload(event).merchantId, env);
  const services = env.merchantServices.findByMerchantId
    ? await env.merchantServices.findByMerchantId(merchant._id)
    : [];
  return success({ merchant, services });
}

async function adminGetMerchantOrders(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const pageInfo = normalizePage(payload);
  if (!payload.merchantId) {
    return buildPagedSuccess({ list: [], total: 0 }, pageInfo, "orders");
  }
  if (!env.orders.queryPage) {
    throw serviceError("ORDER_REPOSITORY_MISSING", "缺少商家订单分页查询能力");
  }
  const filters = { provider_type: SERVICE_PROVIDER_TYPE.MERCHANT };
  filters.merchant_id = payload.merchantId;
  if (payload.status) filters.status = payload.status;
  const pageData = await env.orders.queryPage(filters, pageInfo);
  return buildPagedSuccess(pageData, pageInfo, "orders");
}

async function adminGetMerchantActionLogs(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  if (!env.merchantLogs.queryPage) {
    throw serviceError("MERCHANT_LOG_REPOSITORY_MISSING", "缺少商家日志分页查询能力");
  }
  const filters = {};
  if (payload.merchantId) filters.merchant_id = payload.merchantId;
  const pageInfo = normalizePage(payload);
  const pageData = await env.merchantLogs.queryPage(filters, pageInfo);
  return buildPagedSuccess(pageData, pageInfo, "logs");
}

const actions = Object.freeze({
  applyMerchant,
  getMyMerchantInfo,
  getMerchantAuditStatus,
  createMerchantService,
  getMerchantServiceList,
  enableMerchantService,
  disableMerchantService,
  getStoreList,
  getStoreDetail,
  getStoreServices,
  getMerchantOrderList,
  getMerchantOrderDetail,
  merchantAcceptOrder,
  merchantStartService,
  merchantFinishService,
  adminGetMerchantList,
  adminGetMerchantDetail,
  adminApproveMerchant,
  adminRejectMerchant,
  adminEnableMerchant,
  adminDisableMerchant,
  adminGetMerchantOrders,
  adminGetMerchantActionLogs,
});

async function handleMerchant(event = {}, env = {}) {
  const action = actions[event.action];
  if (!action) return fail("ACTION_NOT_FOUND", "未知商家操作");
  try {
    return await action(event, env);
  } catch (error) {
    return fail(
      error.errorCode || "INTERNAL_ERROR",
      error.message || "商家操作失败",
    );
  }
}

module.exports = {
  handleMerchant,
  applyMerchant,
  adminApproveMerchant,
  adminRejectMerchant,
  createMerchantService,
  getStoreList,
  getStoreDetail,
  merchantAcceptOrder,
  merchantStartService,
  merchantFinishService,
  SERVICE_PROVIDER_TYPE,
  MERCHANT_AUDIT_STATUS,
  MERCHANT_STATUS,
  MERCHANT_SERVICE_STATUS,
};
