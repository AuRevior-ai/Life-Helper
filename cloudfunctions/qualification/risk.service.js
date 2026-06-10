const { success, serviceError } = require("./_shared/response");
const { getPayload } = require("./_shared/payload");
const { getNow } = require("./_shared/time");
const { normalizePage, buildPageResult } = require("./_shared/pagination");
const { PROVIDER_TYPE, RISK_LEVEL } = require("./qualification.constants");
const {
  trimText,
  requireValidRiskLevel,
} = require("./qualification.validator");
const {
  requireAdmin,
  requireOpenid,
  resolveMyProviderContext,
} = require("./qualification.service");
const {
  findLatestRisk,
  getOnboardingSnapshot,
  createOnboardingLog,
} = require("./onboarding.service");

async function createRiskRecord(context, env, data) {
  const now = getNow(env);
  return env.riskRecords.create({
    ...context,
    risk_level: data.risk_level || RISK_LEVEL.LOW,
    risk_tags: data.risk_tags || [],
    risk_reason: data.risk_reason || "",
    action: data.action || "risk_update",
    operator_openid: env.openid || "",
    created_at: now,
    updated_at: now,
  });
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

async function getMyRiskStatus(event, env) {
  const context = await resolveMyProviderContext(env);
  const snapshot = await getOnboardingSnapshot(context, env);
  return success({
    risk_level: snapshot.risk ? snapshot.risk.risk_level : RISK_LEVEL.LOW,
    onboarding_status: snapshot.onboarding_status,
    can_operate: snapshot.can_operate,
    message: snapshot.message,
  });
}

async function adminSetRiskLevel(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const merchantId = payload.merchantId || payload.merchant_id;
  if (!merchantId) throw serviceError("MERCHANT_ID_MISSING", "缺少商家 ID");
  const riskLevel = trimText(payload.riskLevel || payload.risk_level);
  requireValidRiskLevel(riskLevel);
  const context = {
    merchant_id: merchantId,
    provider_id: payload.providerId || payload.provider_id || "",
    provider_type:
      payload.providerType || payload.provider_type || PROVIDER_TYPE.MERCHANT,
  };
  const existing = await findLatestRisk(context, env);
  const risk = await createRiskRecord(context, env, {
    risk_level: riskLevel,
    risk_tags: existing ? existing.risk_tags || [] : [],
    risk_reason: trimText(payload.reason),
    action: "set_risk_level",
  });
  const snapshot = await getOnboardingSnapshot(context, env);
  await createOnboardingLog(env, {
    ...context,
    event_type: "risk_level_set",
    before_status: existing ? existing.risk_level : RISK_LEVEL.LOW,
    after_status: riskLevel,
    operator_role: "admin",
    operator_openid: requireOpenid(env),
    remark: trimText(payload.reason),
  });
  return success({ risk, onboarding_status: snapshot.onboarding_status });
}

async function adminAddRiskTag(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const merchantId = payload.merchantId || payload.merchant_id;
  if (!merchantId) throw serviceError("MERCHANT_ID_MISSING", "缺少商家 ID");
  const context = {
    merchant_id: merchantId,
    provider_id: payload.providerId || payload.provider_id || "",
    provider_type:
      payload.providerType || payload.provider_type || PROVIDER_TYPE.MERCHANT,
  };
  const existing = await findLatestRisk(context, env);
  const riskTag = trimText(payload.riskTag || payload.risk_tag);
  const riskTags = Array.from(
    new Set(
      [...(existing ? existing.risk_tags || [] : []), riskTag].filter(Boolean),
    ),
  );
  const risk = await createRiskRecord(context, env, {
    risk_level: existing ? existing.risk_level : RISK_LEVEL.MEDIUM,
    risk_tags: riskTags,
    risk_reason: trimText(payload.reason),
    action: "add_risk_tag",
  });
  await createOnboardingLog(env, {
    ...context,
    event_type: "risk_tag_added",
    operator_role: "admin",
    operator_openid: requireOpenid(env),
    remark: riskTag,
  });
  return success({ risk });
}

async function adminListRiskRecords(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  if (!env.riskRecords.queryPage) {
    throw serviceError("RISK_RECORD_REPOSITORY_MISSING", "缺少风控记录分页查询能力");
  }
  const filters = {};
  if (payload.merchantId || payload.merchant_id) {
    filters.merchant_id = payload.merchantId || payload.merchant_id;
  }
  if (payload.riskLevel || payload.risk_level) {
    filters.risk_level = payload.riskLevel || payload.risk_level;
  }
  const pageInfo = normalizePage(payload);
  const pageData = await env.riskRecords.queryPage(filters, pageInfo, {
    orderByField: "created_at",
  });
  return buildPagedSuccess(pageData, pageInfo, "riskRecords");
}

async function adminGetOnboardingDetail(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const context = {
    merchant_id: payload.merchantId || payload.merchant_id,
    provider_type:
      payload.providerType || payload.provider_type || PROVIDER_TYPE.MERCHANT,
  };
  const snapshot = await getOnboardingSnapshot(context, env);
  return success(snapshot);
}

async function adminSetOnboardingLimit(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const merchantId = payload.merchantId || payload.merchant_id;
  const list = await env.qualifications.findAll();
  const existing = list.find(
    (item) =>
      item.merchant_id === merchantId &&
      item.provider_type === PROVIDER_TYPE.MERCHANT,
  );
  if (!existing)
    throw serviceError("QUALIFICATION_NOT_FOUND", "资质记录不存在");
  const qualification = await env.qualifications.updateById(existing._id, {
    manual_limited: payload.limited !== false,
    manual_limit_reason: trimText(payload.reason),
    updated_at: getNow(env),
  });
  const snapshot = await getOnboardingSnapshot(qualification, env);
  await createOnboardingLog(env, {
    ...qualification,
    event_type: "onboarding_manual_limit",
    after_status: snapshot.onboarding_status,
    operator_role: "admin",
    operator_openid: requireOpenid(env),
    remark: trimText(payload.reason),
  });
  return success({
    qualification,
    onboarding_status: snapshot.onboarding_status,
  });
}

async function getOnboardingStatus(event, env) {
  const context = await resolveMyProviderContext(env);
  const snapshot = await getOnboardingSnapshot(context, env);
  return success({
    onboarding_status: snapshot.onboarding_status,
    can_operate: snapshot.can_operate,
    message: snapshot.message,
  });
}

module.exports = {
  getMyRiskStatus,
  adminSetRiskLevel,
  adminAddRiskTag,
  adminListRiskRecords,
  adminGetOnboardingDetail,
  adminSetOnboardingLimit,
  getOnboardingStatus,
};
