const { serviceError } = require("./_shared/response");
const {
  QUALIFICATION_STATUS,
  DEPOSIT_STATUS,
  RISK_LEVEL,
  ONBOARDING_STATUS,
  PROVIDER_TYPE,
} = require("./qualification.constants");

function getNow(env = {}) {
  return env.now ? env.now() : new Date();
}

async function findOwnedQualification(context, env) {
  if (!env.qualifications) return null;
  if (env.qualifications.findByOwner)
    return env.qualifications.findByOwner(context);
  const list = env.qualifications.findAll
    ? await env.qualifications.findAll()
    : [];
  return (
    list.find(
      (item) =>
        item.merchant_id === context.merchant_id &&
        item.provider_type === context.provider_type,
    ) || null
  );
}

async function findOwnedDeposit(context, env) {
  if (!env.deposits) return null;
  if (env.deposits.findByOwner) return env.deposits.findByOwner(context);
  const list = env.deposits.findAll ? await env.deposits.findAll() : [];
  return (
    list.find(
      (item) =>
        item.merchant_id === context.merchant_id &&
        item.provider_type === context.provider_type,
    ) || null
  );
}

async function findLatestRisk(context, env) {
  if (!env.riskRecords) return null;
  const list = env.riskRecords.findByMerchantId
    ? await env.riskRecords.findByMerchantId(context.merchant_id)
    : await env.riskRecords.findAll();
  const matched = list.filter(
    (item) =>
      item.merchant_id === context.merchant_id &&
      item.provider_type === context.provider_type,
  );
  return matched.reduce((latest, item) => {
    if (!latest) return item;
    return new Date(item.created_at || 0) >= new Date(latest.created_at || 0)
      ? item
      : latest;
  }, null);
}

function computeOnboardingStatus({ qualification, deposit, risk }) {
  if (risk && risk.risk_level === RISK_LEVEL.BLOCKED)
    return ONBOARDING_STATUS.BLOCKED;
  if (risk && risk.risk_level === RISK_LEVEL.HIGH)
    return ONBOARDING_STATUS.RISK_REVIEW;
  if (
    !qualification ||
    qualification.qualification_status === QUALIFICATION_STATUS.NOT_SUBMITTED
  )
    return ONBOARDING_STATUS.INCOMPLETE;
  if (qualification.manual_limited) return ONBOARDING_STATUS.LIMITED;
  if (
    qualification.qualification_status === QUALIFICATION_STATUS.PENDING_REVIEW
  )
    return ONBOARDING_STATUS.QUALIFICATION_WAIT;
  if (
    [
      QUALIFICATION_STATUS.REJECTED,
      QUALIFICATION_STATUS.NEED_SUPPLEMENT,
      QUALIFICATION_STATUS.DRAFT,
    ].includes(qualification.qualification_status)
  ) {
    return ONBOARDING_STATUS.INCOMPLETE;
  }
  if (qualification.qualification_status !== QUALIFICATION_STATUS.APPROVED)
    return ONBOARDING_STATUS.INCOMPLETE;

  const depositStatus = deposit
    ? deposit.deposit_status
    : DEPOSIT_STATUS.UNPAID;
  if (
    ![DEPOSIT_STATUS.NOT_REQUIRED, DEPOSIT_STATUS.MOCK_PAID].includes(
      depositStatus,
    )
  )
    return ONBOARDING_STATUS.DEPOSIT_WAIT;

  return ONBOARDING_STATUS.ACTIVE;
}

function getSafeOnboardingMessage(status) {
  if (status === ONBOARDING_STATUS.ACTIVE) return "当前可正常经营";
  if (status === ONBOARDING_STATUS.LIMITED) return "平台要求限制部分经营能力";
  if (status === ONBOARDING_STATUS.BLOCKED) return "平台要求补充材料或暂停经营";
  if (status === ONBOARDING_STATUS.RISK_REVIEW)
    return "平台要求补充材料或等待复核";
  if (status === ONBOARDING_STATUS.DEPOSIT_WAIT)
    return "请先完成模拟保证金流程";
  if (status === ONBOARDING_STATUS.QUALIFICATION_WAIT)
    return "资质正在等待平台审核";
  return "请先完成模拟资质认证流程";
}

async function getOnboardingSnapshot(context, env) {
  const qualification = await findOwnedQualification(context, env);
  const deposit = await findOwnedDeposit(context, env);
  const risk = await findLatestRisk(context, env);
  const onboarding_status = computeOnboardingStatus({
    qualification,
    deposit,
    risk,
  });
  return {
    qualification,
    deposit,
    risk,
    onboarding_status,
    can_operate: onboarding_status === ONBOARDING_STATUS.ACTIVE,
    message: getSafeOnboardingMessage(onboarding_status),
  };
}

async function createOnboardingLog(env, data) {
  if (!env.onboardingLogs || !env.onboardingLogs.create) return null;
  return env.onboardingLogs.create({
    merchant_id: data.merchant_id || "",
    provider_id: data.provider_id || "",
    provider_type: data.provider_type || PROVIDER_TYPE.MERCHANT,
    event_type: data.event_type || "onboarding_update",
    before_status: data.before_status || "",
    after_status: data.after_status || "",
    operator_role: data.operator_role || "system",
    operator_openid: data.operator_openid || env.openid || "",
    remark: data.remark || "",
    created_at: getNow(env),
  });
}

async function canMerchantOperate(context, env) {
  const snapshot = await getOnboardingSnapshot(
    {
      merchant_id: context.merchantId || context.merchant_id,
      provider_type:
        context.providerType || context.provider_type || PROVIDER_TYPE.MERCHANT,
    },
    env,
  );
  return {
    can_operate: snapshot.can_operate,
    onboarding_status: snapshot.onboarding_status,
    message: snapshot.message,
  };
}

function assertCanMerchantOperate(result) {
  if (!result.can_operate) {
    throw serviceError(
      "MERCHANT_ONBOARDING_BLOCKED",
      result.message || "商家入驻状态暂不可经营",
    );
  }
}

module.exports = {
  findOwnedQualification,
  findOwnedDeposit,
  findLatestRisk,
  computeOnboardingStatus,
  getOnboardingSnapshot,
  getSafeOnboardingMessage,
  createOnboardingLog,
  canMerchantOperate,
  assertCanMerchantOperate,
};
