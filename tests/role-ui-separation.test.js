const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function createMessages(records = []) {
  return {
    async findByUserId(userId) {
      return records
        .filter((message) => message.user_id === userId)
        .map((message) => ({ ...message }));
    },
  };
}

test("profile page hides user-only entries when active identity is worker and exposes worker/merchant entries", () => {
  const profileJs = read("miniprogram/pages/profile/profile.js");
  const profileWxml = read("miniprogram/pages/profile/profile.wxml");

  assert.match(profileJs, /getCurrentIdentityRole/);
  assert.match(profileJs, /isWorkerIdentity/);
  assert.match(profileJs, /goWorkerCenter/);
  assert.match(profileJs, /goMerchantApply/);
  assert.match(profileWxml, /wx:if="{{ isUserIdentity }}"/);
  assert.match(profileWxml, /wx:if="{{ isWorkerIdentity }}"/);
  assert.match(profileWxml, /师傅工作台/);
  assert.match(profileWxml, /商家入驻/);
});

test("role selection separates worker and merchant entry points", () => {
  const roleJs = read("miniprogram/pages/role-select/role-select.js");
  const roleWxml = read("miniprogram/pages/role-select/role-select.wxml");

  assert.match(roleJs, /enterMerchantRole/);
  assert.match(roleJs, /\/pages\/merchant\/audit-status\/audit-status/);
  assert.match(roleWxml, /个人师傅端/);
  assert.match(roleWxml, /商家端/);
});

test("message list requests current identity role and backend filters messages by role", async () => {
  const messageListJs = read("miniprogram/pages/message-list/message-list.js");
  assert.match(messageListJs, /getCurrentIdentityRole/);
  assert.match(messageListJs, /role: getCurrentIdentityRole\(\)/);

  const { handleMessage } = require("../cloudfunctions/message/handler");
  const userResult = await handleMessage(
    { action: "getMessageList", role: "user" },
    {
      openid: "openid_same",
      messages: createMessages([
        {
          _id: "msg_reply_legacy",
          user_id: "openid_same",
          role: "worker",
          type: "worker_review_reply",
          is_read: false,
        },
        {
          _id: "msg_worker",
          user_id: "openid_same",
          role: "worker",
          is_read: false,
        },
      ]),
    },
  );
  assert.equal(userResult.success, true);
  assert.deepEqual(
    userResult.data.list.map((message) => message._id),
    ["msg_reply_legacy"],
  );
  assert.equal(userResult.data.list[0].role, "user");

  const workerResult = await handleMessage(
    { action: "getMessageList", role: "worker" },
    {
      openid: "openid_same",
      messages: createMessages([
        {
          _id: "msg_user",
          user_id: "openid_same",
          role: "user",
          is_read: false,
        },
        {
          _id: "msg_worker",
          user_id: "openid_same",
          role: "worker",
          is_read: false,
        },
        {
          _id: "msg_reply_legacy",
          user_id: "openid_same",
          role: "worker",
          type: "worker_review_reply",
          is_read: false,
        },
        { _id: "msg_common", user_id: "openid_same", is_read: false },
      ]),
    },
  );

  assert.equal(workerResult.success, true);
  assert.deepEqual(
    workerResult.data.list.map((message) => message._id),
    ["msg_worker", "msg_common"],
  );
  assert.equal(workerResult.data.unread_count, 2);
});

test("worker profile has direct review operation entry", () => {
  const workerProfileJs = read("miniprogram/pages/worker/profile/profile.js");
  const workerProfileWxml = read(
    "miniprogram/pages/worker/profile/profile.wxml",
  );

  assert.match(workerProfileJs, /goReviewList/);
  assert.match(workerProfileJs, /online_status:\s*onlineStatus/);
  assert.match(workerProfileWxml, /用户评价/);
});
