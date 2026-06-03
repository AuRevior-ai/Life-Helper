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

function readJson(relativePath) {
  return JSON.parse(read(relativePath));
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

function runReleaseRisk(args) {
  return childProcess.spawnSync(
    process.execPath,
    [path.join(rootDir, "scripts/check-release-risk.js"), ...args],
    { encoding: "utf8" },
  );
}

test("release risk scanner fails clearly when target directory does not exist", () => {
  const missingDir = path.join(os.tmpdir(), `missing-release-${Date.now()}`);
  const result = runReleaseRisk([missingDir]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout + result.stderr, /待扫描目录不存在/);
});

test("release risk scanner ignores docs, tests, mock, and example payment references", () => {
  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "release-risk-safe-"));
  fs.mkdirSync(path.join(tempDir, "docs"));
  fs.mkdirSync(path.join(tempDir, "tests"));
  fs.mkdirSync(path.join(tempDir, "cloudfunctions", "payment"), {
    recursive: true,
  });
  fs.writeFileSync(
    path.join(tempDir, "docs", "wechat-pay-setup.md"),
    "mchid apiv3 apiclient_key.pem setup note",
  );
  fs.writeFileSync(
    path.join(tempDir, "docs", "wechat-pay-config.example.md"),
    "example APIv3",
  );
  fs.writeFileSync(
    path.join(tempDir, "tests", "phase13.wechat-pay-lite.test.js"),
    "assert.match(text, /mchid/)",
  );
  fs.writeFileSync(
    path.join(tempDir, "cloudfunctions", "payment", "config.example.js"),
    'module.exports = { mchid: "example" }',
  );
  fs.writeFileSync(
    path.join(tempDir, "cloudfunctions", "payment", "wechat-pay-client.js"),
    "mock placeholder client",
  );

  const result = runReleaseRisk([tempDir]);

  assert.equal(result.status, 0, result.stdout + result.stderr);
  assert.match(result.stdout, /交付风险检查通过/);
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("release risk scanner blocks sensitive delivery files", () => {
  const tempDir = fs.mkdtempSync(
    path.join(os.tmpdir(), "release-risk-sensitive-"),
  );
  fs.writeFileSync(path.join(tempDir, ".env"), "SECRET=1");
  fs.writeFileSync(path.join(tempDir, "project.private.config.json"), "{}");
  fs.writeFileSync(
    path.join(tempDir, "apiclient_key.pem"),
    "-----BEGIN PRIVATE KEY-----\nsecret",
  );

  const result = runReleaseRisk([tempDir]);

  assert.notEqual(result.status, 0);
  assert.match(result.stdout, /\.env/);
  assert.match(result.stdout, /project\.private\.config\.json/);
  assert.match(result.stdout, /apiclient_key\.pem/);
  fs.rmSync(tempDir, { recursive: true, force: true });
});

test("README AppID guidance follows current config without hardcoding a historical AppID in tests", () => {
  const exampleConfig = readJson("project.config.example.json");
  const readme = read("README.md");

  assert.equal(exampleConfig.appid, "touristappid");
  assert.match(readme, /project\.config\.example\.json/);
  assert.match(readme, /touristappid/);
  assert.match(readme, /真实小程序 AppID/);
  assert.match(readme, /复制 `project\.config\.example\.json` 为 `project\.config\.json`/);
  assert.match(readme, /公开交付/);
  assert.doesNotMatch(
    readme,
    /当前 `appid` 使用 `wx[a-f0-9]{16,}`/i,
  );
});

test("PAY_MODE=wechat fails fast instead of returning empty real payment parameters", async () => {
  const {
    createWechatPayClient,
  } = require("../cloudfunctions/payment/wechat-pay-client");
  const client = createWechatPayClient({ enabled: true });

  await assert.rejects(
    () => client.createPrepay({ out_trade_no: "order_1" }),
    (error) => {
      assert.equal(
        error.errorCode || error.message,
        "WECHAT_PAY_NOT_IMPLEMENTED",
      );
      assert.match(error.message, /真实微信支付尚未实现/);
      return true;
    },
  );
});

test("mock payment contract remains documented while wechat payment is fail-fast only", () => {
  const readme = read("README.md");
  const setup = read("docs/wechat-pay-setup.md");

  assert.match(readme, /当前只能使用 mock 支付/);
  assert.match(setup, /PAY_MODE=wechat/);
  assert.match(setup, /真实微信支付尚未实现/);
  assert.match(setup, /JSAPI 下单/);
  assert.match(setup, /回调验签/);
});

test("more cloudfunctions consume shared low-risk utilities", () => {
  const targets = [
    "order",
    "admin",
    "finance",
    "refund",
    "review",
    "worker",
    "promotion",
    "dispatch",
    "area",
    "service",
    "user",
    "login",
  ];
  const wired = targets.filter((name) => {
    const handler = read(path.join("cloudfunctions", name, "handler.js"));
    return /require\(['"]\.\/_shared\/(?:response|payload|time|pagination)['"]\)/.test(
      handler,
    );
  });

  assert.ok(
    wired.length >= 7,
    `expected at least 7 phase 19.6 shared utility consumers, got ${wired.join(", ")}`,
  );
});

test("cloudfunction wx-server-sdk dependency versions stay unified", () => {
  const versions = new Map();
  for (const entry of fs.readdirSync(path.join(rootDir, "cloudfunctions"), {
    withFileTypes: true,
  })) {
    const packagePath = path.join("cloudfunctions", entry.name, "package.json");
    if (!entry.isDirectory() || !exists(packagePath)) {
      continue;
    }
    const pkg = readJson(packagePath);
    const version = pkg.dependencies && pkg.dependencies["wx-server-sdk"];
    assert.ok(version, `${packagePath} should declare wx-server-sdk`);
    if (!versions.has(version)) {
      versions.set(version, []);
    }
    versions.get(version).push(entry.name);
  }

  assert.equal(
    versions.size,
    1,
    JSON.stringify(Object.fromEntries(versions), null, 2),
  );
});

test("core database JSON schemas exist and are referenced by markdown contract", () => {
  const schemaFiles = [
    "schema/orders.schema.json",
    "schema/users.schema.json",
    "schema/merchants.schema.json",
    "schema/service-providers.schema.json",
    "schema/finance-logs.schema.json",
    "schema/worker-earnings.schema.json",
    "schema/payment-logs.schema.json",
    "schema/refund-logs.schema.json",
  ];
  const markdown = read("docs/contracts/database-schema.md");

  for (const schemaFile of schemaFiles) {
    assert.equal(exists(schemaFile), true, `${schemaFile} should exist`);
    const schema = readJson(schemaFile);
    for (const key of [
      "collection",
      "description",
      "requiredFields",
      "serverOnlyFields",
      "clientWritableFields",
      "statusFields",
      "relationFields",
      "indexHints",
      "compatibilityNotes",
    ]) {
      assert.ok(
        Object.prototype.hasOwnProperty.call(schema, key),
        `${schemaFile} missing ${key}`,
      );
    }
    assert.ok(
      schema.requiredFields.length > 0,
      `${schemaFile} should have requiredFields`,
    );
    assert.match(
      markdown,
      new RegExp(schemaFile.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});

test("api action manifest covers handlers and is referenced by markdown contract", () => {
  const manifestPath = "docs/contracts/api-actions.manifest.json";
  assert.equal(exists(manifestPath), true);
  const manifest = readJson(manifestPath);
  const markdown = read("docs/contracts/api-actions.md");

  for (const functionName of [
    "order",
    "payment",
    "merchant",
    "admin",
    "finance",
    "refund",
    "review",
    "worker",
    "promotion",
    "dispatch",
    "area",
    "service",
    "user",
    "login",
    "message",
    "address",
    "tip",
  ]) {
    assert.ok(manifest[functionName], `${functionName} missing from manifest`);
    assert.ok(
      Array.isArray(manifest[functionName].actions),
      `${functionName}.actions should be an array`,
    );
    const handler = read(
      path.join("cloudfunctions", functionName, "handler.js"),
    );
    for (const action of manifest[functionName].actions) {
      assert.match(
        handler,
        new RegExp(action.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
        `${action} should appear in ${functionName}/handler.js`,
      );
    }
  }

  assert.match(markdown, /api-actions\.manifest\.json/);
});

test("pagination and indexes contract documents list action risks and shared page limits", () => {
  const doc = read("docs/contracts/pagination-and-indexes.md");
  const { normalizePage } = require("../cloudfunctions/_shared/pagination");

  assert.deepEqual(normalizePage({ page: 0, pageSize: 999 }), {
    page: 1,
    pageSize: 50,
  });
  assert.deepEqual(normalizePage({ page: "bad", pageSize: "bad" }), {
    page: 1,
    pageSize: 20,
  });

  for (const snippet of [
    "listOrders",
    "listFinanceLogs",
    "listWorkerEarnings",
    "listReviews",
    "listAfterSales",
    "listDispatchLogs",
    "listMessages",
    "最大 pageSize",
  ]) {
    assert.match(
      doc,
      new RegExp(snippet.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")),
    );
  }
});
