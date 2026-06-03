const { success, serviceError } = require("./_shared/response");
const { getPayload } = require("./_shared/payload");
const { getNow } = require("./_shared/time");
const { paginateList } = require("./_shared/pagination");
const {
  PROVIDER_TYPE,
  QUALIFICATION_STATUS,
  ONBOARDING_STATUS,
} = require("./qualification.constants");
const {
  trimText,
  normalizeQualificationPayload,
  requireAgreement,
  requireValidQualificationReview,
} = require("./qualification.validator");
const {
  findOwnedQualification,
  getOnboardingSnapshot,
  createOnboardingLog,
} = require("./onboarding.service");

function requireOpenid(env = {}) {
  if (!env.openid) throw serviceError("OPENID_MISSING", "无法获取用户 openid");
  return env.openid;
}

async function requireCurrentUser(env = {}) {
  const user = await env.users.findByOpenid(requireOpenid(env));
  if (!user || user.status === "disabled")
    throw serviceError("USER_NOT_FOUND", "用户不存在或已禁用");
  return user;
}

async function requireAdmin(env = {}) {
  const user = await requireCurrentUser(env);
  if (user.role !== "admin")
    throw serviceError("PERMISSION_DENIED", "当前操作需要管理员权限");
  return user;
}

async function resolveMyProviderContext(env = {}) {
  const openid = requireOpenid(env);
  const merchant =
    env.merchants && env.merchants.findByUserId
      ? await env.merchants.findByUserId(openid)
      : null;
  if (merchant) {
    return {
      merchant_id: merchant._id,
      provider_id: merchant.provider_id || "",
      provider_type: PROVIDER_TYPE.MERCHANT,
      owner_openid: openid,
    };
  }
  throw serviceError("MERCHANT_NOT_FOUND", "商家不存在");
}

async function getMyQualification(event, env) {
  const context = await resolveMyProviderContext(env);
  const qualification = await findOwnedQualification(context, env);
  const snapshot = await getOnboardingSnapshot(context, env);
  return success({
    qualification,
    qualification_status: qualification
      ? qualification.qualification_status
      : QUALIFICATION_STATUS.NOT_SUBMITTED,
    onboarding_status: snapshot.onboarding_status,
    can_operate: snapshot.can_operate,
  });
}

async function upsertQualification(context, env, data) {
  const existing = await findOwnedQualification(context, env);
  const now = getNow(env);
  if (existing) {
    return env.qualifications.updateById(existing._id, {
      ...data,
      updated_at: now,
    });
  }
  return env.qualifications.create({
    ...context,
    ...data,
    submit_count: Number(data.submit_count || 0),
    created_at: now,
    updated_at: now,
  });
}

async function saveQualificationDraft(event, env) {
  const context = await resolveMyProviderContext(env);
  const payload = normalizeQualificationPayload(getPayload(event));
  const qualification = await upsertQualification(context, env, {
    ...payload,
    qualification_status: QUALIFICATION_STATUS.DRAFT,
  });
  await createOnboardingLog(env, {
    ...context,
    event_type: "qualification_draft_saved",
    after_status: QUALIFICATION_STATUS.DRAFT,
    operator_role: "merchant",
  });
  return success({ qualification });
}

async function submitQualification(event, env) {
  const context = await resolveMyProviderContext(env);
  const payload = getPayload(event);
  const existing = await findOwnedQualification(context, env);
  const normalized = Object.keys(payload).length
    ? normalizeQualificationPayload(payload)
    : existing;
  if (!normalized)
    throw serviceError("QUALIFICATION_NOT_FOUND", "请先保存资质草稿");
  requireAgreement(normalized);
  const qualification = await upsertQualification(context, env, {
    ...normalized,
    qualification_status: QUALIFICATION_STATUS.PENDING_REVIEW,
    submit_count: Number((existing && existing.submit_count) || 0) + 1,
    reject_reason: "",
    supplement_required_fields: [],
  });
  const snapshot = await getOnboardingSnapshot(context, env);
  await createOnboardingLog(env, {
    ...context,
    event_type: "qualification_submitted",
    before_status: existing
      ? existing.qualification_status
      : QUALIFICATION_STATUS.NOT_SUBMITTED,
    after_status: QUALIFICATION_STATUS.PENDING_REVIEW,
    operator_role: "merchant",
  });
  return success({
    qualification,
    onboarding_status:
      snapshot.onboarding_status || ONBOARDING_STATUS.QUALIFICATION_WAIT,
  });
}

async function resubmitQualification(event, env) {
  const context = await resolveMyProviderContext(env);
  const existing = await findOwnedQualification(context, env);
  if (!existing)
    throw serviceError("QUALIFICATION_NOT_FOUND", "资质记录不存在");
  requireAgreement(existing);
  const qualification = await upsertQualification(context, env, {
    ...existing,
    qualification_status: QUALIFICATION_STATUS.PENDING_REVIEW,
    submit_count: Number(existing.submit_count || 0) + 1,
    updated_at: getNow(env),
  });
  await createOnboardingLog(env, {
    ...context,
    event_type: "qualification_resubmitted",
    before_status: existing.qualification_status,
    after_status: QUALIFICATION_STATUS.PENDING_REVIEW,
    operator_role: "merchant",
  });
  return success({ qualification });
}

async function adminListQualifications(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  let list = await env.qualifications.findAll();
  if (payload.status)
    list = list.filter((item) => item.qualification_status === payload.status);
  return success(paginateList(list, payload, { listKey: "qualifications" }));
}

async function adminGetQualificationDetail(event, env) {
  await requireAdmin(env);
  const id =
    getPayload(event).qualificationId || getPayload(event).qualification_id;
  const qualification = await env.qualifications.findById(id);
  if (!qualification)
    throw serviceError("QUALIFICATION_NOT_FOUND", "资质记录不存在");
  const snapshot = await getOnboardingSnapshot(qualification, env);
  return success({
    qualification,
    onboarding_status: snapshot.onboarding_status,
  });
}

async function adminReviewQualification(event, env) {
  await requireAdmin(env);
  const payload = getPayload(event);
  const result = trimText(payload.reviewResult || payload.review_result);
  requireValidQualificationReview(result);
  const id = payload.qualificationId || payload.qualification_id;
  const existing = await env.qualifications.findById(id);
  if (!existing)
    throw serviceError("QUALIFICATION_NOT_FOUND", "资质记录不存在");
  const updated = await env.qualifications.updateById(id, {
    qualification_status: result,
    reviewer_openid: requireOpenid(env),
    reviewed_at: getNow(env),
    reject_reason:
      result === QUALIFICATION_STATUS.REJECTED
        ? trimText(payload.reason) || "资料不完整"
        : "",
    supplement_required_fields:
      result === QUALIFICATION_STATUS.NEED_SUPPLEMENT
        ? payload.supplementRequiredFields ||
          payload.supplement_required_fields ||
          []
        : [],
    review_remark: trimText(payload.reason),
    updated_at: getNow(env),
  });
  const snapshot = await getOnboardingSnapshot(updated, env);
  await createOnboardingLog(env, {
    ...updated,
    event_type: "qualification_review",
    before_status: existing.qualification_status,
    after_status: result,
    operator_role: "admin",
    remark: trimText(payload.reason),
  });
  return success({
    qualification: updated,
    onboarding_status: snapshot.onboarding_status,
  });
}

function getQualificationRequirements() {
  return success({
    mock_warning:
      "当前为模拟资质认证流程，请勿上传真实身份证、营业执照、保单等敏感材料。",
    subject_types: ["individual", "business"],
    required_fields: [
      "subject_type",
      "service_categories",
      "agreement_checked",
    ],
  });
}

module.exports = {
  requireOpenid,
  requireCurrentUser,
  requireAdmin,
  resolveMyProviderContext,
  getMyQualification,
  saveQualificationDraft,
  submitQualification,
  resubmitQualification,
  adminListQualifications,
  adminGetQualificationDetail,
  adminReviewQualification,
  getQualificationRequirements,
};
