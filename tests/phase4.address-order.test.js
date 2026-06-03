const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const rootDir = path.resolve(__dirname, "..");

function fixedNow() {
  return new Date("2026-05-30T06:30:00.000Z");
}

function createMemoryAddresses(initialAddresses = []) {
  const records = initialAddresses.map((address) => ({ ...address }));

  return {
    records,

    async findByUserId(userId) {
      return records
        .filter((address) => address.user_id === userId)
        .slice()
        .sort(
          (left, right) => Number(right.is_default) - Number(left.is_default),
        )
        .map((address) => ({ ...address }));
    },

    async findById(id) {
      const address = records.find((item) => item._id === id);
      return address ? { ...address } : null;
    },

    async create(data) {
      const record = {
        ...data,
        _id: `address_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },

    async updateById(id, data) {
      const record = records.find((address) => address._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },

    async deleteById(id) {
      const index = records.findIndex((address) => address._id === id);
      if (index < 0) return false;
      records.splice(index, 1);
      return true;
    },

    async clearDefaultForUser(userId) {
      records
        .filter((address) => address.user_id === userId)
        .forEach((address) => {
          address.is_default = false;
        });
    },
  };
}

function createMemoryOrders(initialOrders = []) {
  const records = initialOrders.map((order) => ({ ...order }));

  return {
    records,

    async findByUserId(userId) {
      return records
        .filter((order) => order.user_id === userId)
        .slice()
        .sort((left, right) =>
          `${right.created_at}`.localeCompare(`${left.created_at}`),
        )
        .map((order) => ({ ...order }));
    },

    async findById(id) {
      const order = records.find((item) => item._id === id);
      return order ? { ...order } : null;
    },

    async create(data) {
      const record = {
        ...data,
        _id: `order_${records.length + 1}`,
      };
      records.push(record);
      return { ...record };
    },

    async updateById(id, data) {
      const record = records.find((order) => order._id === id);
      if (!record) return null;
      Object.assign(record, data);
      return { ...record };
    },
  };
}

test("address cloud function creates a validated default address for current user", async () => {
  const { handleAddress } = require("../cloudfunctions/address/handler");
  const addresses = createMemoryAddresses();

  const result = await handleAddress(
    {
      action: "createAddress",
      contact_name: "张三",
      phone: "13800138000",
      city: "杭州",
      community: "未来小区",
      detail_address: "1 幢 101",
      is_default: true,
    },
    {
      openid: "openid_user",
      addresses,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.address._id, "address_1");
  assert.equal(result.data.address.user_id, "openid_user");
  assert.equal(result.data.address.contact_name, "张三");
  assert.equal(result.data.address.phone, "13800138000");
  assert.equal(result.data.address.is_default, true);
  assert.equal(
    result.data.address.created_at.toISOString(),
    "2026-05-30T06:30:00.000Z",
  );
});

test("address cloud function keeps one default address per user and isolates lists", async () => {
  const { handleAddress } = require("../cloudfunctions/address/handler");
  const addresses = createMemoryAddresses([
    {
      _id: "address_old",
      user_id: "openid_user",
      contact_name: "旧地址",
      phone: "13800138000",
      city: "杭州",
      community: "旧小区",
      detail_address: "2 幢 201",
      is_default: true,
    },
    {
      _id: "address_other",
      user_id: "openid_other",
      contact_name: "其他人",
      phone: "13900139000",
      city: "杭州",
      community: "别的小区",
      detail_address: "3 幢 301",
      is_default: true,
    },
  ]);

  const result = await handleAddress(
    {
      action: "createAddress",
      contact_name: "新地址",
      phone: "13800138000",
      city: "杭州",
      community: "未来小区",
      detail_address: "1 幢 101",
      is_default: true,
    },
    {
      openid: "openid_user",
      addresses,
      now: fixedNow,
    },
  );
  assert.equal(result.success, true);

  const listResult = await handleAddress(
    { action: "getAddressList" },
    {
      openid: "openid_user",
      addresses,
      now: fixedNow,
    },
  );

  assert.equal(listResult.success, true);
  assert.deepEqual(
    listResult.data.addresses.map((address) => address._id),
    ["address_3", "address_old"],
  );
  assert.deepEqual(
    listResult.data.addresses.map((address) => address.is_default),
    [true, false],
  );
  assert.equal(
    addresses.records.find((address) => address._id === "address_other")
      .is_default,
    true,
  );
});

test("address cloud function updates and deletes only owner addresses", async () => {
  const { handleAddress } = require("../cloudfunctions/address/handler");
  const addresses = createMemoryAddresses([
    {
      _id: "address_own",
      user_id: "openid_user",
      contact_name: "张三",
      phone: "13800138000",
      city: "杭州",
      community: "未来小区",
      detail_address: "1 幢 101",
      is_default: false,
    },
    {
      _id: "address_other",
      user_id: "openid_other",
      contact_name: "李四",
      phone: "13900139000",
      city: "杭州",
      community: "其他小区",
      detail_address: "2 幢 202",
      is_default: false,
    },
  ]);

  const updateResult = await handleAddress(
    {
      action: "updateAddress",
      addressId: "address_own",
      contact_name: "张三",
      phone: "13800138000",
      city: "杭州",
      community: "未来小区",
      detail_address: "9 幢 909",
      is_default: true,
    },
    {
      openid: "openid_user",
      addresses,
      now: fixedNow,
    },
  );

  assert.equal(updateResult.success, true);
  assert.equal(updateResult.data.address.detail_address, "9 幢 909");
  assert.equal(updateResult.data.address.is_default, true);

  const forbiddenResult = await handleAddress(
    {
      action: "deleteAddress",
      addressId: "address_other",
    },
    {
      openid: "openid_user",
      addresses,
      now: fixedNow,
    },
  );

  assert.equal(forbiddenResult.success, false);
  assert.equal(forbiddenResult.errorCode, "PERMISSION_DENIED");
  assert.equal(
    addresses.records.some((address) => address._id === "address_other"),
    true,
  );
});

test("order cloud function creates pending-pay order with service and address snapshots", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const addresses = createMemoryAddresses([
    {
      _id: "address_1",
      user_id: "openid_user",
      contact_name: "张三",
      phone: "13800138000",
      city: "杭州",
      community: "未来小区",
      detail_address: "1 幢 101",
      is_default: true,
    },
  ]);
  const orders = createMemoryOrders();

  const result = await handleOrder(
    {
      action: "createOrder",
      serviceId: "svc_home_daily_clean",
      addressId: "address_1",
      appointment_time: "2026-06-01 10:00",
      remark: "请提前联系",
    },
    {
      openid: "openid_user",
      addresses,
      orders,
      now: fixedNow,
      orderNoFactory: () => "OD_TEST_001",
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.order._id, "order_1");
  assert.equal(result.data.order.order_no, "OD_TEST_001");
  assert.equal(result.data.order.user_id, "openid_user");
  assert.equal(result.data.order.service_id, "svc_home_daily_clean");
  assert.equal(result.data.order.service_name, "日常保洁");
  assert.equal(result.data.order.category_name, "家政保洁");
  assert.equal(result.data.order.price, 9900);
  assert.equal(result.data.order.contact_name, "张三");
  assert.equal(result.data.order.contact_phone, "13800138000");
  assert.equal(result.data.order.full_address, "杭州 未来小区 1 幢 101");
  assert.equal(result.data.order.status, "pending_pay");
  assert.equal(result.data.order.pay_status, "unpaid");
});

test("order cloud function mock payment moves own order to pending accept", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const orders = createMemoryOrders([
    {
      _id: "order_1",
      order_no: "OD_TEST_001",
      user_id: "openid_user",
      service_name: "日常保洁",
      price: 9900,
      status: "pending_pay",
      pay_status: "unpaid",
      created_at: new Date("2026-05-30T06:00:00.000Z"),
    },
  ]);

  const result = await handleOrder(
    {
      action: "mockPayOrder",
      orderId: "order_1",
    },
    {
      openid: "openid_user",
      orders,
      now: fixedNow,
    },
  );

  assert.equal(result.success, true);
  assert.equal(result.data.order.status, "pending_accept");
  assert.equal(result.data.order.pay_status, "paid");
  assert.equal(
    result.data.order.paid_at.toISOString(),
    "2026-05-30T06:30:00.000Z",
  );
});

test("order cloud function returns only current user orders and detail", async () => {
  const { handleOrder } = require("../cloudfunctions/order/handler");
  const orders = createMemoryOrders([
    {
      _id: "order_own_1",
      user_id: "openid_user",
      service_name: "日常保洁",
      price: 9900,
      status: "pending_accept",
      pay_status: "paid",
      created_at: new Date("2026-05-30T06:10:00.000Z"),
    },
    {
      _id: "order_other",
      user_id: "openid_other",
      service_name: "水电检修",
      price: 6900,
      status: "pending_accept",
      pay_status: "paid",
      created_at: new Date("2026-05-30T06:20:00.000Z"),
    },
  ]);

  const listResult = await handleOrder(
    { action: "getUserOrderList" },
    {
      openid: "openid_user",
      orders,
      now: fixedNow,
    },
  );

  assert.equal(listResult.success, true);
  assert.deepEqual(
    listResult.data.orders.map((order) => order._id),
    ["order_own_1"],
  );

  const detailResult = await handleOrder(
    {
      action: "getOrderDetail",
      orderId: "order_own_1",
    },
    {
      openid: "openid_user",
      orders,
      now: fixedNow,
    },
  );

  assert.equal(detailResult.success, true);
  assert.equal(detailResult.data.order._id, "order_own_1");
});

test("address and order pages are wired to phase four services and navigation", () => {
  const serviceDetailJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/service-detail/service-detail.js"),
    "utf8",
  );
  const addressListJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/address-list/address-list.js"),
    "utf8",
  );
  const addressEditJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/address-edit/address-edit.js"),
    "utf8",
  );
  const orderSubmitJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/order-submit/order-submit.js"),
    "utf8",
  );
  const orderListJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/order-list/order-list.js"),
    "utf8",
  );
  const orderDetailJs = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/order-detail/order-detail.js"),
    "utf8",
  );
  const orderSubmitWxml = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/order-submit/order-submit.wxml"),
    "utf8",
  );
  const orderDetailWxml = fs.readFileSync(
    path.join(rootDir, "miniprogram/pages/order-detail/order-detail.wxml"),
    "utf8",
  );

  assert.match(serviceDetailJs, /order-submit/);
  assert.match(addressListJs, /getAddressList/);
  assert.match(addressListJs, /setDefaultAddress/);
  assert.match(addressEditJs, /createAddress/);
  assert.match(addressEditJs, /updateAddress/);
  assert.match(orderSubmitJs, /createOrder/);
  assert.match(orderSubmitJs, /getServiceDetail/);
  assert.match(orderSubmitJs, /getAddressList/);
  assert.match(orderListJs, /getUserOrderList/);
  assert.match(orderDetailJs, /getOrderDetail/);
  assert.match(orderDetailJs, /mockPayOrder/);
  assert.match(orderSubmitWxml, /预约时间/);
  assert.match(orderDetailWxml, /模拟支付/);
});
