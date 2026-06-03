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
