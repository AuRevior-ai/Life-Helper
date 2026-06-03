const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

test("phase 20 actions, pages, schemas, and documentation are synchronized", () => {
  const manifest = readJson("docs/contracts/api-actions.manifest.json");
  const apiDoc = read("docs/contracts/api-actions.md");
  const statusDoc = read("docs/contracts/status-contract.md");
  const dbDoc = read("docs/contracts/database-schema.md");
  const permissionDoc = read("docs/contracts/permission-matrix.md");
  const paginationDoc = read("docs/contracts/pagination-and-indexes.md");
  const readme = read("README.md");
  const appJson = read("miniprogram/app.json");
  const record = read(
    "docs/dev-records/20_deposit-qualification-certification.md",
  );

  const actions = [
    "getMyQualification",
    "saveQualificationDraft",
    "submitQualification",
    "resubmitQualification",
    "getMyDeposit",
    "mockPayDeposit",
    "applyDepositRefund",
    "getMyRiskStatus",
    "getOnboardingStatus",
    "adminListQualifications",
    "adminGetQualificationDetail",
    "adminReviewQualification",
    "adminListDeposits",
    "adminFreezeDeposit",
    "adminReviewDepositRefund",
    "adminSetRiskLevel",
    "adminAddRiskTag",
    "adminListRiskRecords",
    "adminGetOnboardingDetail",
    "getQualificationRequirements",
    "getDepositRules",
  ];
  assert.ok(manifest.qualification);
  for (const action of actions) {
    assert.ok(
      manifest.qualification.actions.includes(action),
      `${action} missing from manifest`,
    );
    assert.match(apiDoc, new RegExp(action));
  }

  for (const schemaFile of [
    "schema/merchant-qualifications.schema.json",
    "schema/merchant-deposits.schema.json",
    "schema/merchant-risk-records.schema.json",
    "schema/merchant-onboarding-logs.schema.json",
  ]) {
    assert.equal(exists(schemaFile), true, `${schemaFile} should exist`);
    const schema = readJson(schemaFile);
    assert.ok(schema.collection);
    assert.ok(Array.isArray(schema.requiredFields));
    assert.match(dbDoc, new RegExp(schema.collection));
  }

  for (const snippet of [
    "QUALIFICATION_STATUS",
    "DEPOSIT_STATUS",
    "RISK_LEVEL",
    "ONBOARDING_STATUS",
    "merchant_qualifications",
    "merchant_deposits",
    "qualification",
    "模拟保证金",
    "真实身份证认证",
    "真实营业执照认证",
    "真实 OCR",
    "真实保险核验",
  ]) {
    assert.match(
      statusDoc + dbDoc + permissionDoc + paginationDoc + readme + record,
      new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }

  for (const pagePath of [
    "pages/merchant/qualification/qualification",
    "pages/merchant/deposit/deposit",
    "pages/merchant/risk-status/risk-status",
    "pages/admin/qualification-review/qualification-review",
    "pages/admin/deposit-review/deposit-review",
    "pages/admin/risk-control/risk-control",
  ]) {
    assert.match(appJson, new RegExp(pagePath));
  }
});
