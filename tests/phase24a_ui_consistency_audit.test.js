const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function assertRuleBlockIncludes(style, selector, pattern, message) {
  const blocks = [...style.matchAll(/([^{}]+)\{([^{}]+)\}/g)].filter((match) =>
    match[1].split(",").some((part) => part.trim() === selector),
  );
  assert.ok(blocks.length, `${selector} should exist`);
  assert.ok(blocks.some((match) => pattern.test(match[2])), message);
}

const completedShellPages = [
  ["user service list", "miniprogram/pages/service-list/service-list", "ui-kit.wxss", "ui-page"],
  ["user order detail", "miniprogram/pages/order-detail/order-detail", "ui-kit.wxss", "ui-page"],
  ["user member center", "miniprogram/pages/member/center/center", "ui-kit.wxss", "ui-page"],
  ["worker order detail", "miniprogram/pages/worker/order-detail/order-detail", "worker-subpage.wxss", "worker-subpage"],
  ["worker service range", "miniprogram/pages/provider/service-range/service-range", "worker-subpage.wxss", "worker-subpage"],
  ["merchant profile", "miniprogram/pages/merchant/profile/profile", "merchant-theme.wxss", "merchant-page"],
  ["merchant apply", "miniprogram/pages/merchant/apply/apply", "merchant-theme.wxss", "merchant-page"],
  ["merchant deposit", "miniprogram/pages/merchant/deposit/deposit", "merchant-theme.wxss", "merchant-page"],
  ["admin dashboard", "miniprogram/pages/admin/dashboard/dashboard", "admin-theme.wxss", "admin-page"],
  ["admin order list", "miniprogram/pages/admin/order-list/order-list", "admin-theme.wxss", "admin-page"],
  ["admin review center", "miniprogram/pages/admin/review-center/review-center", "admin-theme.wxss", "admin-page"],
  ["admin operation center", "miniprogram/pages/admin/operation-center/operation-center", "admin-theme.wxss", "admin-page"],
  ["admin profile", "miniprogram/pages/admin/profile/profile", "admin-theme.wxss", "admin-page"],
];

test("phase 24A documents the full-role UI consistency audit scope", () => {
  const phase = read("docs/PHASE_CURRENT.md");
  const status = read("docs/PROJECT_STATUS.md");
  const guide = read("docs/ui-style-guide.md");
  const guardrails = read("docs/ui-refactor-guardrails.md");
  const index = read("docs/dev-records/index.md");

  for (const doc of [phase, status, guide, guardrails, index]) {
    assert.match(doc, /阶段 24A/);
  }

  for (const text of [
    "全端 UI 统一性体检与设计规范收口",
    "不开发新业务",
    "不接入真实支付、退款、提现、分账、真实认证、OCR、保证金支付或真实风控",
    "下一阶段适合进入管理员端二级页面 UI 收口",
  ]) {
    assert.match(phase, new RegExp(text));
  }
});

test("phase 24A style guide lists completed UI pages and reusable rules", () => {
  const guide = read("docs/ui-style-guide.md");

  for (const text of [
    "用户端已完成 UI 重构页面",
    "师傅端已完成 UI 重构页面",
    "商家端已完成 UI 重构页面",
    "管理员端已完成 UI 重构页面",
    "页面壳",
    "背景色",
    "卡片",
    "标题",
    "按钮",
    "状态标签",
    "空状态",
    "加载态",
    "错误态",
    "底部操作栏",
    "管理员端二级页面",
  ]) {
    assert.match(guide, new RegExp(text));
  }
});

test("completed role UI pages keep their role shell and theme imports", () => {
  for (const [name, pageBase, themeFile, shellClass] of completedShellPages) {
    const wxml = read(`${pageBase}.wxml`);
    const wxss = read(`${pageBase}.wxss`);

    assert.match(wxss, new RegExp(themeFile.replace(".", "\\.")), `${name} should import ${themeFile}`);
    assert.match(wxml, new RegExp(shellClass), `${name} should use ${shellClass}`);
  }
});

test("role theme files keep shared shell, card, and pill button fundamentals", () => {
  const themeFiles = [
    ["user", "miniprogram/styles/ui-kit.wxss", "ui-primary-button"],
    ["worker", "miniprogram/styles/worker-subpage.wxss", "worker-primary-button"],
    ["admin", "miniprogram/styles/admin-theme.wxss", "admin-action-button"],
    ["merchant", "miniprogram/styles/merchant-theme.wxss", "merchant-action-button"],
  ];

  for (const [name, relativePath, buttonClass] of themeFiles) {
    const style = read(relativePath);
    assert.match(style, /min-height:\s*100vh/, `${name} theme should define full-height page shell`);
    assert.match(style, /background:\s*#f[0-9a-f]{5}/i, `${name} theme should define a light page background`);
    assert.match(style, /box-shadow:/, `${name} theme should define card shadow language`);
    assert.match(style, /border-radius:\s*(2[4-9]|3[0-2])rpx/, `${name} theme should define rounded cards`);
    assert.match(style, /font-family:/, `${name} theme should define system font stack`);
    assertRuleBlockIncludes(style, `.${buttonClass}`, /border-radius:\s*999rpx/, `${name} primary button should be pill shaped`);
    assert.match(style, new RegExp(`\\.${buttonClass}::after|\\.${buttonClass}[\\s\\S]*::after`), `${name} button reset should remove native border`);
  }
});

test("admin secondary page guardrail is ready for the next UI phase", () => {
  const guardrails = read("docs/ui-refactor-guardrails.md");

  for (const text of [
    "管理员端二级页面 UI 收口保护清单",
    "pages/admin/order-detail/order-detail",
    "pages/admin/worker-audit/worker-audit",
    "pages/admin/after-sale-list/after-sale-list",
    "pages/admin/after-sale-detail/after-sale-detail",
    "pages/admin/finance-log-list/finance-log-list",
    "pages/admin/qualification-review/qualification-review",
    "不得修改云函数",
    "不得修改 `miniprogram/services/*`",
    "不得接入真实支付",
    "不得让前端直接决定订单完成、支付成功、退款成功或收益结算",
  ]) {
    assert.match(guardrails, new RegExp(text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")));
  }
});
