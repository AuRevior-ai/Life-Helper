const test = require("node:test");
const assert = require("node:assert/strict");
const childProcess = require("node:child_process");
const fs = require("node:fs");
const os = require("node:os");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function listHandlerFiles() {
  return fs
    .readdirSync(path.join(rootDir, "cloudfunctions"), { withFileTypes: true })
    .filter(
      (entry) =>
        entry.isDirectory() &&
        exists(path.join("cloudfunctions", entry.name, "handler.js")),
    )
    .map((entry) => path.join("cloudfunctions", entry.name, "handler.js"));
}

test("shared cloudfunction utilities preserve response, payload, time, and pagination contracts", () => {
  const {
    success,
    fail,
    serviceError,
  } = require("../cloudfunctions/_shared/response");
  const { getPayload } = require("../cloudfunctions/_shared/payload");
  const { getNow } = require("../cloudfunctions/_shared/time");
  const {
    normalizePage,
    buildPageResult,
    paginateList,
  } = require("../cloudfunctions/_shared/pagination");

  assert.deepEqual(success({ id: 1 }), {
    success: true,
    data: { id: 1 },
    message: "success",
  });
  assert.deepEqual(fail("ACTION_NOT_FOUND", "未知操作"), {
    success: false,
    errorCode: "ACTION_NOT_FOUND",
    message: "未知操作",
  });

  const error = serviceError("ORDER_NOT_FOUND", "订单不存在");
  assert.equal(error.message, "订单不存在");
  assert.equal(error.errorCode, "ORDER_NOT_FOUND");

  assert.deepEqual(getPayload({ action: "x", orderId: "order_1" }), {
    orderId: "order_1",
  });
  assert.deepEqual(
    getPayload({ payload: { orderId: "order_2" }, action: "x" }),
    { orderId: "order_2" },
  );

  const now = new Date("2026-06-02T00:00:00.000Z");
  assert.equal(getNow({ now: () => now }), now);

  assert.deepEqual(normalizePage({ page: "2", pageSize: "2" }), {
    page: 2,
    pageSize: 2,
  });
  assert.deepEqual(
    buildPageResult(["c", "d"], { total: 5, page: 2, pageSize: 2 }),
    {
      list: ["c", "d"],
      total: 5,
      page: 2,
      pageSize: 2,
      hasMore: true,
    },
  );
  assert.deepEqual(
    paginateList(
      ["a", "b", "c"],
      { page: 1, pageSize: 2 },
      { listKey: "messages" },
    ),
    {
      list: ["a", "b"],
      messages: ["a", "b"],
      total: 3,
      page: 1,
      pageSize: 2,
      hasMore: true,
    },
  );
});

test("at least five cloudfunctions consume shared low-risk utilities", () => {
  const sharedRequirePattern =
    /require\(['"]\.\/_shared\/(?:response|payload|time|pagination)['"]\)/;
  const wiredHandlers = listHandlerFiles().filter((relativePath) =>
    sharedRequirePattern.test(read(relativePath)),
  );
  assert.ok(
    wiredHandlers.length >= 5,
    `expected at least 5 shared utility consumers, got ${wiredHandlers.length}`,
  );
});

test("status contract keeps core frontend and cloudfunction status constants aligned", () => {
  const frontend = require("../miniprogram/config/status");
  const order = require("../cloudfunctions/order/handler");
  const payment = require("../cloudfunctions/payment/handler");
  const refund = require("../cloudfunctions/refund/handler");
  const finance = require("../cloudfunctions/finance/handler");
  const promotion = require("../cloudfunctions/promotion/handler");
  const merchant = require("../cloudfunctions/merchant/handler");
  const qualification = require("../cloudfunctions/qualification/handler");

  assert.deepEqual(order.ORDER_STATUS, frontend.ORDER_STATUS);
  assert.deepEqual(order.PAY_STATUS, frontend.PAY_STATUS);
  assert.deepEqual(payment.PAY_STATUS, frontend.PAY_STATUS);
  assert.deepEqual(refund.AFTER_SALE_STATUS, frontend.AFTER_SALE_STATUS);
  assert.deepEqual(refund.REFUND_STATUS, frontend.REFUND_STATUS);
  assert.deepEqual(
    finance.WORKER_EARNING_STATUS,
    frontend.WORKER_EARNING_STATUS,
  );
  assert.deepEqual(promotion.MEMBER_STATUS, frontend.MEMBER_STATUS);
  assert.deepEqual(
    merchant.SERVICE_PROVIDER_TYPE,
    frontend.SERVICE_PROVIDER_TYPE,
  );
  assert.deepEqual(merchant.MERCHANT_STATUS, frontend.MERCHANT_STATUS);
  assert.deepEqual(
    qualification.QUALIFICATION_STATUS,
    frontend.QUALIFICATION_STATUS,
  );
  assert.deepEqual(qualification.DEPOSIT_STATUS, frontend.DEPOSIT_STATUS);
  assert.deepEqual(qualification.RISK_LEVEL, frontend.RISK_LEVEL);
  assert.deepEqual(qualification.ONBOARDING_STATUS, frontend.ONBOARDING_STATUS);
});

test("governance contract documents exist and contain non-empty required sections", () => {
  const documents = [
    [
      "docs/release-checklist.md",
      [".git", "project.private.config.json", "mock 支付", "真实支付"],
    ],
    [
      "docs/contracts/status-contract.md",
      ["ORDER_STATUS", "PAY_STATUS", "REFUND_STATUS", "MERCHANT_STATUS"],
    ],
    [
      "docs/contracts/database-schema.md",
      ["users", "orders", "merchant_services", "worker_earnings"],
    ],
    [
      "docs/contracts/api-actions.md",
      ["order", "createOrder", "merchant", "applyMerchant"],
    ],
    [
      "docs/contracts/permission-matrix.md",
      ["游客", "普通用户", "师傅", "商家", "管理员"],
    ],
    [
      "docs/dev-records/19.5-engineering-governance.md",
      ["工程治理", "公共工具", "测试结果", "阶段 20"],
    ],
  ];

  for (const [relativePath, requiredSnippets] of documents) {
    assert.equal(exists(relativePath), true, `${relativePath} should exist`);
    const content = read(relativePath);
    assert.ok(
      content.length > 1200,
      `${relativePath} should not be an empty placeholder`,
    );
    for (const snippet of requiredSnippets) {
      assert.match(
        content,
        new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${relativePath} should mention ${snippet}`,
      );
    }
  }
});

test("release boundary configuration excludes local, secret, and generated delivery risks", () => {
  const gitignore = read(".gitignore");
  const releaseChecklist = read("docs/release-checklist.md");
  const requiredIgnorePatterns = [
    ".git/",
    "node_modules/",
    "cloudfunctions/*/node_modules/",
    "miniprogram_npm/",
    ".env",
    ".env.*",
    "*.log",
    "project.config.json",
    "project.private.config.json",
    "*.pem",
    "*.key",
    "*.crt",
    "*.p12",
    "*.zip",
    "coverage/",
  ];

  for (const pattern of requiredIgnorePatterns) {
    assert.match(
      gitignore,
      new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `.gitignore missing ${pattern}`,
    );
  }

  for (const forbidden of [
    ".git",
    "project.private.config.json",
    "APIv3",
    "证书",
    "真实支付配置",
  ]) {
    assert.match(
      releaseChecklist,
      new RegExp(forbidden.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
      `release checklist missing ${forbidden}`,
    );
  }
});

test("release risk scanner fails when a candidate package contains sensitive files", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "release-risk-"));
  fs.mkdirSync(path.join(tempDir, ".git"));
  fs.writeFileSync(path.join(tempDir, ".env"), "SECRET=1");
  fs.writeFileSync(path.join(tempDir, "project.private.config.json"), "{}");
  fs.writeFileSync(path.join(tempDir, "merchant.pem"), "secret");
  fs.writeFileSync(path.join(tempDir, "debug.log"), "debug");

  const result = childProcess.spawnSync(
    process.execPath,
    [path.join(rootDir, "scripts/check-release-risk.js"), tempDir],
    { encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /交付风险检查失败/);
  assert.match(result.stdout, /\.git/);
  assert.match(result.stdout, /project\.private\.config\.json/);
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("release risk scanner fails when a candidate package contains real project config AppID", () => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "release-risk-project-config-"),
  );
  fs.writeFileSync(
    path.join(tempDir, "project.config.json"),
    JSON.stringify({
      appid: "wx1234567890abcdef",
      miniprogramRoot: "miniprogram/",
      cloudfunctionRoot: "cloudfunctions/",
    }),
  );
  fs.writeFileSync(
    path.join(tempDir, "project.config.example.json"),
    JSON.stringify({ appid: "touristappid" }),
  );

  const result = childProcess.spawnSync(
    process.execPath,
    [path.join(rootDir, "scripts/check-release-risk.js"), tempDir],
    { encoding: "utf8" },
  );

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /交付风险检查失败/);
  assert.match(result.stdout, /project\.config\.json/);
  assert.match(result.stdout, /real project config/);
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("README and project config describe real AppID and mock payment boundary consistently", () => {
  const projectConfig = JSON.parse(read("project.config.json"));
  const projectConfigExample = JSON.parse(read("project.config.example.json"));
  const readme = read("README.md");

  assert.ok(
    projectConfig.appid,
    "project.config.json should declare the current AppID strategy",
  );
  assert.notEqual(projectConfig.appid, "touristappid");
  assert.equal(projectConfigExample.appid, "touristappid");
  assert.match(readme, /真实小程序 AppID/);
  assert.match(readme, /project\.config\.example\.json/);
  assert.match(readme, /公开交付/);
  assert.doesNotMatch(readme, /当前 `appid` 使用 `touristappid`/);
  assert.match(readme, /当前只能使用 mock 支付/);
  assert.match(readme, /无真实扣款/);
  assert.match(readme, /无真实退款/);
  assert.match(readme, /无真实分账/);
  assert.match(readme, /自动化测试/);
});
