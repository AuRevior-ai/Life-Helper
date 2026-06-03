const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("toast helper keeps success feedback visible long enough", () => {
  const toast = read("miniprogram/utils/toast.js");

  assert.match(toast, /duration:\s*2000/);
});

test("review appeal actions hide loading before showing explicit success feedback", () => {
  const workerReview = read(
    "miniprogram/pages/worker/review-detail/review-detail.js",
  );
  const adminAppeal = read(
    "miniprogram/pages/admin/review-appeal-detail/review-appeal-detail.js",
  );
  const adminReview = read(
    "miniprogram/pages/admin/review-detail/review-detail.js",
  );

  assert.match(
    workerReview,
    /hideLoading\(\)[\s\S]*showSuccess\(["']申诉提交成功["']/,
  );
  assert.match(
    workerReview,
    /hideLoading\(\)[\s\S]*showSuccess\(["']回复提交成功["']/,
  );
  assert.match(
    adminAppeal,
    /hideLoading\(\)[\s\S]*showSuccess\(["']申诉审核已通过["']|hideLoading\(\)[\s\S]*showSuccess\(["']申诉审核已拒绝["']/,
  );
  assert.match(adminReview, /hideLoading\(\)[\s\S]*showSuccess\(["']评价已隐藏["']/);
  assert.match(adminReview, /hideLoading\(\)[\s\S]*showSuccess\(["']评价已恢复["']/);
});

test("merchant and admin merchant operations show clear success and failure feedback", () => {
  const adminMerchant = read(
    "miniprogram/pages/admin/merchant-detail/merchant-detail.js",
  );
  const merchantOrder = read(
    "miniprogram/pages/merchant/order-detail/order-detail.js",
  );
  const merchantApply = read("miniprogram/pages/merchant/apply/apply.js");
  const merchantServiceEdit = read(
    "miniprogram/pages/merchant/service-edit/service-edit.js",
  );

  assert.match(adminMerchant, /showSuccess\(["']商家审核已通过["']\)/);
  assert.match(adminMerchant, /showSuccess\(["']商家审核已拒绝["']\)/);
  assert.match(adminMerchant, /showSuccess\(["']商家已启用["']\)/);
  assert.match(adminMerchant, /showSuccess\(["']商家已停用["']\)/);
  assert.match(adminMerchant, /showError\(error\.message \|\| ["']操作失败["']\)/);

  assert.match(merchantOrder, /showSuccess\(["']商家接单成功["']\)/);
  assert.match(merchantOrder, /showSuccess\(["']商家服务已开始["']\)/);
  assert.match(merchantOrder, /showSuccess\(["']商家完工已提交["']\)/);
  assert.match(merchantOrder, /showError\(error\.message \|\| ["']操作失败["']\)/);

  assert.match(merchantApply, /showSuccess\(["']商家入驻申请已提交["']\)/);
  assert.match(merchantApply, /showError\(error\.message \|\| ["']提交失败["']\)/);
  assert.match(merchantServiceEdit, /showSuccess\(["']商家服务已保存["']\)/);
  assert.match(
    merchantServiceEdit,
    /showError\(error\.message \|\| ["']保存失败["']\)/,
  );
});
