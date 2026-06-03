const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

test("worker order hall replaces page after accepting order to avoid navigateTo stack failures", () => {
  const orderHallJs = read("miniprogram/pages/worker/order-hall/order-hall.js");

  assert.match(orderHallJs, /redirectTo/);
  assert.match(orderHallJs, /acceptedOrderId/);
  assert.doesNotMatch(
    orderHallJs,
    /navigateTo\(\{\s*url:\s*`\/pages\/worker\/order-detail/,
  );
});
