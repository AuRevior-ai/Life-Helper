const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("admin dashboard exposes phase 20 qualification, deposit, and risk review entries", () => {
  const dashboardJs = read("miniprogram/pages/admin/dashboard/dashboard.js");
  const dashboardWxml = read(
    "miniprogram/pages/admin/dashboard/dashboard.wxml",
  );

  assert.match(dashboardJs, /entryGroups/);
  assert.match(dashboardJs, /toggleEntryGroup/);
  assert.match(dashboardWxml, /module-list/);
  assert.match(dashboardWxml, /module-header/);
  assert.match(dashboardJs, /商家准入/);
  assert.match(dashboardJs, /资质审核/);
  assert.match(dashboardJs, /保证金审核/);
  assert.match(dashboardJs, /入驻风控/);
  assert.match(dashboardJs, /qualification-review\/qualification-review/);
  assert.match(dashboardJs, /deposit-review\/deposit-review/);
  assert.match(dashboardJs, /risk-control\/risk-control/);
  assert.doesNotMatch(dashboardWxml, /<view class="entry-list panel">/);
});

test("merchant center exposes phase 20 qualification, deposit, and onboarding status entries", () => {
  const profileJs = read("miniprogram/pages/merchant/profile/profile.js");
  const profileWxml = read("miniprogram/pages/merchant/profile/profile.wxml");

  assert.match(profileWxml, /资质认证/);
  assert.match(profileWxml, /保证金/);
  assert.match(profileWxml, /入驻状态/);
  assert.match(profileJs, /merchant\/qualification\/qualification/);
  assert.match(profileJs, /merchant\/deposit\/deposit/);
  assert.match(profileJs, /merchant\/risk-status\/risk-status/);
});

test("admin qualification and deposit pages handle missing collections without raw cloud database errors", () => {
  const qualificationJs = read(
    "miniprogram/pages/admin/qualification-review/qualification-review.js",
  );
  const qualificationWxml = read(
    "miniprogram/pages/admin/qualification-review/qualification-review.wxml",
  );
  const depositJs = read(
    "miniprogram/pages/admin/deposit-review/deposit-review.js",
  );
  const depositWxml = read(
    "miniprogram/pages/admin/deposit-review/deposit-review.wxml",
  );

  assert.match(qualificationJs, /collectionMissing/);
  assert.match(qualificationJs, /merchant_qualifications/);
  assert.match(qualificationWxml, /资质集合未创建/);
  assert.match(depositJs, /collectionMissing/);
  assert.match(depositJs, /merchant_deposits/);
  assert.match(depositWxml, /保证金集合未创建/);
});
