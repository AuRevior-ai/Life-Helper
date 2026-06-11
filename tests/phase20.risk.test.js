const test = require("node:test");
const assert = require("node:assert/strict");
const { createQualificationEnv } = require("./_phase20.helpers");

test("administrator can set risk level and tags while merchant sees simplified risk status only", async () => {
  const {
    handleQualification,
  } = require("../cloudfunctions/qualification/handler");
  const env = createQualificationEnv();

  const denied = await handleQualification(
    {
      action: "adminSetRiskLevel",
      merchantId: "merchant_1",
      riskLevel: "HIGH",
      reason: "类目需复核",
    },
    env,
  );
  assert.equal(denied.success, false);
  assert.equal(denied.errorCode, "PERMISSION_DENIED");

  const high = await handleQualification(
    {
      action: "adminSetRiskLevel",
      merchantId: "merchant_1",
      riskLevel: "HIGH",
      reason: "类目需复核",
    },
    { ...env, openid: "openid_admin" },
  );
  assert.equal(high.success, true);
  assert.equal(high.data.risk.risk_level, "HIGH");

  const tag = await handleQualification(
    {
      action: "adminAddRiskTag",
      merchantId: "merchant_1",
      riskTag: "MANUAL_REVIEW_REQUIRED",
      reason: "需要人工复核",
    },
    { ...env, openid: "openid_admin" },
  );
  assert.equal(tag.success, true);
  assert.deepEqual(tag.data.risk.risk_tags, ["MANUAL_REVIEW_REQUIRED"]);

  const merchantView = await handleQualification(
    { action: "getMyRiskStatus" },
    env,
  );
  assert.equal(merchantView.success, true);
  assert.equal(merchantView.data.risk_level, "HIGH");
  assert.equal(merchantView.data.onboarding_status, "RISK_REVIEW");
  assert.equal(merchantView.data.message, "平台要求补充材料或等待复核");
  assert.equal(
    Object.prototype.hasOwnProperty.call(merchantView.data, "risk_tags"),
    false,
  );
  assert.equal(
    Object.prototype.hasOwnProperty.call(merchantView.data, "risk_reason"),
    false,
  );
});

test("administrator lists risk records through paged repository query", async () => {
  const {
    handleQualification,
  } = require("../cloudfunctions/qualification/handler");
  const calls = [];
  const env = createQualificationEnv({ openid: "openid_admin" });
  env.riskRecords = {
    async findAll() {
      throw new Error("riskRecords.findAll should not be used for pagination");
    },
    async queryPage(filters, pageInfo) {
      calls.push({ filters, pageInfo });
      return {
        list: [
          {
            _id: "risk_1",
            merchant_id: filters.merchant_id,
            risk_level: filters.risk_level,
          },
        ],
        total: 1,
        page: pageInfo.page,
        pageSize: pageInfo.pageSize,
      };
    },
  };

  const result = await handleQualification(
    {
      action: "adminListRiskRecords",
      merchantId: "merchant_1",
      riskLevel: "HIGH",
      page: 2,
      pageSize: 100,
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.riskRecords.length, 1);
  assert.equal(result.data.pageSize, 50);
  assert.deepEqual(calls, [
    {
      filters: { merchant_id: "merchant_1", risk_level: "HIGH" },
      pageInfo: { page: 2, pageSize: 50 },
    },
  ]);
});

test("administrator onboarding limit uses targeted qualification lookup", async () => {
  const {
    handleQualification,
  } = require("../cloudfunctions/qualification/handler");
  const env = createQualificationEnv({ openid: "openid_admin" });

  await handleQualification(
    { action: "saveQualificationDraft", agreementChecked: true },
    { ...env, openid: "openid_merchant" },
  );

  const targetedLookupCalls = [];
  const originalFindByOwner = env.qualifications.findByOwner;
  env.qualifications = {
    ...env.qualifications,
    async findAll() {
      throw new Error("qualifications.findAll should not be used");
    },
    async findByOwner(query) {
      targetedLookupCalls.push(query);
      return originalFindByOwner.call(this, query);
    },
  };

  const result = await handleQualification(
    {
      action: "adminSetOnboardingLimit",
      merchantId: "merchant_1",
      limited: true,
      reason: "人工限制经营",
    },
    env,
  );

  assert.equal(result.success, true);
  assert.equal(result.data.onboarding_status, "LIMITED");
  assert.deepEqual(targetedLookupCalls[0], {
    merchant_id: "merchant_1",
    provider_type: "merchant",
  });
});
