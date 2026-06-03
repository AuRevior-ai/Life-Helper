const assert = require("node:assert");
const { execSync } = require("node:child_process");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath));
}

test("phase 22C3 worker UI stage report exists and captures completion scope", () => {
  const recordPath = "docs/dev-records/22c3-worker-ui-refactor.md";
  assert.equal(exists(recordPath), true);

  const record = read(recordPath);
  assert.match(record, /阶段 22C3/);
  assert.match(record, /师傅端 UI 重构阶段报告/);
  assert.match(record, /接单大厅/);
  assert.match(record, /我的订单/);
  assert.match(record, /我的/);
  assert.match(record, /审核通过后自动跳转/);
  assert.match(record, /师傅默认头像/);
});

test("README and dev-record index are synchronized to phase 22C3", () => {
  const readme = read("README.md");
  const index = read("docs/dev-records/index.md");

  assert.match(readme, /阶段 22C3：师傅端 UI 重构阶段报告/);
  assert.match(readme, /师傅端 UI 重构已经完成了一大部分/);
  assert.match(index, /22c3-worker-ui-refactor\.md/);
  assert.match(index, /阶段 22C3：师傅端 UI 重构阶段报告/);
  assert.match(index, /接单大厅、我的订单、我的/);
});

test("phase 22C3 report documents UI-only boundaries and verification", () => {
  const record = read("docs/dev-records/22c3-worker-ui-refactor.md");

  for (const text of [
    "不新增真实支付",
    "不新增真实退款",
    "不新增真实提现",
    "不新增自动派单",
    "不新增 AI 派单",
    "不修改订单状态机",
    "不修改云函数接口",
    "npm test",
    "252/252",
  ]) {
    assert.match(record, new RegExp(text));
  }
});

test("phase 22C3 report-only update does not modify cloudfunctions or services", () => {
  const output = execSync("git diff --name-only", {
    cwd: rootDir,
    encoding: "utf8",
  });
  const changedFiles = output
    .split(/\r?\n/)
    .map((item) => item.trim())
    .filter(Boolean);

  assert.equal(
    changedFiles.some((file) => file.startsWith("cloudfunctions/")),
    false,
  );
  assert.equal(
    changedFiles.some((file) => file.startsWith("miniprogram/services/")),
    false,
  );
});
