const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), "utf8");
}

function getEffectiveMessageRole(message = {}) {
  if (message.type === "worker_review_reply") return "user";
  return message.role || "";
}

function messageMatchesFilters(message = {}, filters = {}) {
  if (filters.user_id && message.user_id !== filters.user_id) return false;
  if (filters.role) {
    const role = getEffectiveMessageRole(message);
    if (role && role !== filters.role) return false;
  }
  if (filters.is_read !== undefined && message.is_read !== filters.is_read) {
    return false;
  }
  return true;
}

function createMessages(records = []) {
  return {
    async findByUserId(userId) {
      return records
        .filter((message) => message.user_id === userId)
        .map((message) => ({ ...message }));
    },
    async queryPage(filters = {}, pageInfo = {}) {
      const page = Number(pageInfo.page || 1);
      const pageSize = Number(pageInfo.pageSize || 20);
      const list = records.filter((message) =>
        messageMatchesFilters(message, filters),
      );
      return {
        list: list
          .slice((page - 1) * pageSize, (page - 1) * pageSize + pageSize)
          .map((message) => ({ ...message })),
        total: list.length,
        page,
        pageSize,
      };
    },
    async countUnread(filters = {}) {
      return records.filter((message) =>
        messageMatchesFilters(message, { ...filters, is_read: false }),
      ).length;
    },
  };
}

test("profile page hides user-only entries by active identity and exposes worker/merchant entries separately", () => {
  const profileJs = read("miniprogram/pages/profile/profile.js");
  const profileWxml = read("miniprogram/pages/profile/profile.wxml");

  assert.match(profileJs, /getCurrentIdentityRole/);
  assert.match(profileJs, /isWorkerIdentity/);
  assert.match(profileJs, /isMerchantIdentity/);
  assert.match(profileJs, /goWorkerCenter/);
  assert.match(profileJs, /goMerchantApply/);
  assert.match(profileJs, /goMerchantCenter/);
  assert.match(profileJs, /goMerchantOrders/);
  assert.match(profileWxml, /wx:if="{{ isUserIdentity }}"/);
  assert.match(profileWxml, /wx:if="{{ isWorkerIdentity }}"/);
  assert.match(profileWxml, /wx:if="{{ isMerchantIdentity }}"/);
  assert.match(profileWxml, /师傅工作台/);
  assert.match(profileWxml, /商家工作台/);
  assert.match(profileWxml, /商家订单/);
  assert.match(profileWxml, /商家入驻审核/);
});

test("role selection separates worker and merchant entry points", () => {
  const { USER_ROLE, USER_ROLE_TEXT } = require("../miniprogram/config/roles");
  const roleJs = read("miniprogram/pages/role-select/role-select.js");
  const roleWxml = read("miniprogram/pages/role-select/role-select.wxml");

  assert.equal(USER_ROLE.MERCHANT, "merchant");
  assert.equal(USER_ROLE_TEXT[USER_ROLE.MERCHANT], "商家");
  assert.match(roleJs, /enterMerchantRole/);
  assert.match(roleJs, /setCurrentIdentityRole\(USER_ROLE\.MERCHANT\)/);
  assert.match(roleJs, /\/pages\/merchant\/audit-status\/audit-status/);
  assert.match(roleWxml, /个人师傅端/);
  assert.match(roleWxml, /商家端/);
});

test("message list requests current identity role and backend filters messages by role", async () => {
  const messageListJs = read("miniprogram/pages/message-list/message-list.js");
  assert.match(messageListJs, /getCurrentIdentityRole/);
  assert.match(messageListJs, /role: getCurrentIdentityRole\(\)/);
  assert.match(messageListJs, /\/pages\/merchant\/order-detail\/order-detail/);
  assert.match(messageListJs, /\/pages\/merchant\/audit-status\/audit-status/);

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

  const roleScopedMessages = [
    { _id: "msg_user", user_id: "openid_same", role: "user", is_read: false },
    {
      _id: "msg_worker",
      user_id: "openid_same",
      role: "worker",
      is_read: false,
    },
    {
      _id: "msg_merchant",
      user_id: "openid_same",
      role: "merchant",
      related_type: "order",
      related_id: "merchant_order_1",
      is_read: false,
    },
    {
      _id: "msg_admin",
      user_id: "openid_same",
      role: "admin",
      is_read: false,
    },
  ];
  for (const role of ["user", "worker", "merchant", "admin"]) {
    const result = await handleMessage(
      { action: "getMessageList", role },
      {
        openid: "openid_same",
        messages: createMessages(roleScopedMessages),
      },
    );
    assert.equal(result.success, true);
    assert.deepEqual(
      result.data.list.map((message) => message.role),
      [role],
    );
  }
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
