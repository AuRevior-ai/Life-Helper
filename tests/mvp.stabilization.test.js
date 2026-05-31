const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function fixedNow() {
  return new Date('2026-05-30T18:00:00.000Z')
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function createMemoryUsers(initialUsers = []) {
  const records = initialUsers.map((user) => ({ ...user }))

  return {
    records,

    async findByOpenid(openid) {
      return records.find((user) => user.openid === openid) || null
    },

    async findById(id) {
      return records.find((user) => user._id === id) || null
    },

    async findByRole(role) {
      return records.find((user) => user.role === role) || null
    },

    async updateById(id, data) {
      const record = records.find((user) => user._id === id)
      if (!record) return null
      Object.assign(record, data)
      return { ...record }
    }
  }
}

function createMemoryWorkers(initialWorkers = []) {
  const records = initialWorkers.map((worker) => ({ ...worker }))

  return {
    records,

    async findByUserId(userId) {
      const worker = records.find((item) => item.user_id === userId)
      return worker ? { ...worker } : null
    }
  }
}

function createMemoryOrders(initialOrders = []) {
  const records = initialOrders.map((order) => ({ ...order }))

  return {
    records,

    async findByStatus(status) {
      return records
        .filter((order) => order.status === status)
        .map((order) => ({ ...order }))
    },

    async findById(id) {
      const order = records.find((item) => item._id === id)
      return order ? { ...order } : null
    },

    async updateById(id, data) {
      const record = records.find((order) => order._id === id)
      if (!record) return null
      Object.assign(record, data)
      return { ...record }
    },

    async acceptPendingOrder(id, workerId, data) {
      const record = records.find((order) => order._id === id)
      if (!record || record.status !== 'pending_accept' || record.worker_id) {
        return null
      }
      Object.assign(record, data, { worker_id: workerId })
      return { ...record }
    },

    async completePendingReviewOrder(id, data) {
      const record = records.find((order) => order._id === id)
      if (!record || record.status !== 'pending_review') {
        return null
      }
      Object.assign(record, data)
      return { ...record }
    }
  }
}

function createMemoryReviews(initialReviews = [], options = {}) {
  const records = initialReviews.map((review) => ({ ...review }))

  return {
    records,

    async findByOrderId(orderId) {
      const review = records.find((item) => item.order_id === orderId)
      return review ? { ...review } : null
    },

    async create(data) {
      if (options.failCreate) {
        throw new Error('review create failed')
      }
      if (records.some((review) => review.order_id === data.order_id)) {
        return null
      }
      const record = {
        ...data,
        _id: `review_${records.length + 1}`
      }
      records.push(record)
      return { ...record }
    },

    async deleteById(id) {
      const index = records.findIndex((review) => review._id === id)
      if (index < 0) return false
      records.splice(index, 1)
      return true
    }
  }
}

function createMemoryLogs() {
  const records = []

  return {
    records,

    async create(data) {
      const record = {
        ...data,
        _id: `log_${records.length + 1}`
      }
      records.push(record)
      return { ...record }
    }
  }
}

test('first normal user can claim initial admin when no admin exists', async () => {
  const { handleUser } = require('../cloudfunctions/user/handler')
  const users = createMemoryUsers([
    {
      _id: 'user_1',
      openid: 'openid_user',
      nickname: '首个用户',
      role: 'user',
      status: 'normal'
    }
  ])

  const result = await handleUser(
    { action: 'claimInitialAdmin' },
    {
      openid: 'openid_user',
      users,
      config: {
        adminBootstrapEnabled: true,
        adminBootstrapAllowedOpenids: ['openid_user']
      },
      now: fixedNow
    }
  )

  assert.equal(result.success, true)
  assert.equal(result.data.user.role, 'admin')
  assert.equal(users.records[0].role, 'admin')
})

test('claimInitialAdmin requires bootstrap switch and optional openid allowlist', async () => {
  const { handleUser } = require('../cloudfunctions/user/handler')
  const users = createMemoryUsers([
    {
      _id: 'user_1',
      openid: 'openid_user',
      nickname: '普通用户',
      role: 'user',
      status: 'normal'
    }
  ])

  const disabledResult = await handleUser(
    { action: 'claimInitialAdmin' },
    {
      openid: 'openid_user',
      users,
      config: {
        adminBootstrapEnabled: false
      },
      now: fixedNow
    }
  )
  assert.equal(disabledResult.success, false)
  assert.equal(disabledResult.errorCode, 'ADMIN_BOOTSTRAP_DISABLED')

  const notAllowedResult = await handleUser(
    { action: 'claimInitialAdmin' },
    {
      openid: 'openid_user',
      users,
      config: {
        adminBootstrapEnabled: true,
        adminBootstrapAllowedOpenids: ['openid_admin_seed']
      },
      now: fixedNow
    }
  )
  assert.equal(notAllowedResult.success, false)
  assert.equal(notAllowedResult.errorCode, 'ADMIN_BOOTSTRAP_OPENID_DENIED')
  assert.equal(users.records[0].role, 'user')
})

test('claimInitialAdmin is rejected after an admin already exists', async () => {
  const { handleUser } = require('../cloudfunctions/user/handler')
  const users = createMemoryUsers([
    {
      _id: 'admin_1',
      openid: 'openid_admin',
      nickname: '管理员',
      role: 'admin',
      status: 'normal'
    },
    {
      _id: 'user_1',
      openid: 'openid_user',
      nickname: '普通用户',
      role: 'user',
      status: 'normal'
    }
  ])

  const result = await handleUser(
    { action: 'claimInitialAdmin' },
    {
      openid: 'openid_user',
      users,
      now: fixedNow
    }
  )

  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'ADMIN_ALREADY_EXISTS')
  assert.equal(users.records[1].role, 'user')
})

test('identity selection page differentiates user, worker, admin, and partner placeholders', () => {
  const roleSelectJs = read('miniprogram/pages/role-select/role-select.js')
  const roleSelectWxml = read('miniprogram/pages/role-select/role-select.wxml')
  const roleSelectWxss = read('miniprogram/pages/role-select/role-select.wxss')
  const profileWxml = read('miniprogram/pages/profile/profile.wxml')
  const appJson = read('miniprogram/app.json')
  const userService = read('miniprogram/services/user.service.js')

  assert.match(appJson, /pages\/profile-edit\/profile-edit/)
  assert.match(appJson, /pages\/role-select\/role-select/)
  assert.match(userService, /claimInitialAdmin/)
  assert.match(roleSelectJs, /enterUserRole/)
  assert.match(roleSelectJs, /enterWorkerRole/)
  assert.match(roleSelectJs, /enterAdminRole/)
  assert.match(roleSelectJs, /claimInitialAdmin/)
  assert.match(roleSelectJs, /enterCommunityPartnerRole/)
  assert.match(roleSelectJs, /enterCityPartnerRole/)
  assert.match(roleSelectWxml, /普通用户端/)
  assert.match(roleSelectWxml, /师傅\/商家端/)
  assert.match(roleSelectWxml, /管理员端/)
  assert.match(roleSelectWxml, /小区合伙人端/)
  assert.match(roleSelectWxml, /城市合伙人端/)
  assert.match(roleSelectWxss, /identity-card\.worker/)
  assert.match(roleSelectWxss, /identity-card\.admin/)
  assert.match(profileWxml, /完善资料/)
  assert.match(profileWxml, /选择登录身份/)
})

test('profile edit page lets users update nickname and phone through user service', () => {
  const profileEditJs = read('miniprogram/pages/profile-edit/profile-edit.js')
  const profileEditWxml = read('miniprogram/pages/profile-edit/profile-edit.wxml')

  assert.match(profileEditJs, /updateUserInfo/)
  assert.match(profileEditJs, /setCurrentUser/)
  assert.match(profileEditJs, /PHONE_INVALID/)
  assert.match(profileEditWxml, /昵称/)
  assert.match(profileEditWxml, /手机号/)
  assert.match(profileEditWxml, /保存资料/)
})

test('admin category and service edit pages provide minimal create and update forms', () => {
  const categoryListJs = read('miniprogram/pages/admin/category-list/category-list.js')
  const categoryEditJs = read('miniprogram/pages/admin/category-edit/category-edit.js')
  const categoryEditWxml = read('miniprogram/pages/admin/category-edit/category-edit.wxml')
  const serviceListJs = read('miniprogram/pages/admin/service-list/service-list.js')
  const serviceEditJs = read('miniprogram/pages/admin/service-edit/service-edit.js')
  const serviceEditWxml = read('miniprogram/pages/admin/service-edit/service-edit.wxml')

  assert.match(categoryListJs, /goCreateCategory/)
  assert.match(categoryListJs, /goEditCategory/)
  assert.match(categoryEditJs, /createCategory/)
  assert.match(categoryEditJs, /updateCategory/)
  assert.match(categoryEditWxml, /分类名称/)
  assert.match(categoryEditWxml, /保存分类/)
  assert.doesNotMatch(categoryEditWxml, /MVP 阶段暂不开放分类编辑/)

  assert.match(serviceListJs, /goCreateService/)
  assert.match(serviceListJs, /goEditService/)
  assert.match(serviceEditJs, /createService/)
  assert.match(serviceEditJs, /updateService/)
  assert.match(serviceEditWxml, /服务名称/)
  assert.match(serviceEditWxml, /保存服务/)
  assert.doesNotMatch(serviceEditWxml, /MVP 阶段暂不开放服务编辑/)
})

test('worker accept uses conditional update and rejects already claimed order clearly', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_pending',
      user_id: 'openid_user',
      worker_id: 'openid_other',
      status: 'accepted',
      pay_status: 'paid'
    }
  ])

  const result = await handleOrder(
    { action: 'acceptOrder', orderId: 'order_pending' },
    {
      openid: 'openid_worker',
      workers: createMemoryWorkers([
        { user_id: 'openid_worker', audit_status: 'approved', status: 'enabled' }
      ]),
      orders,
      now: fixedNow
    }
  )

  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'ORDER_ALREADY_ACCEPTED')
  assert.equal(orders.records[0].worker_id, 'openid_other')
})

test('worker order hall filters pending orders by worker category and service area', async () => {
  const { handleWorker } = require('../cloudfunctions/worker/handler')
  const result = await handleWorker(
    { action: 'getOrderHallList' },
    {
      openid: 'openid_worker',
      workers: createMemoryWorkers([
        {
          user_id: 'openid_worker',
          audit_status: 'approved',
          status: 'enabled',
          service_category: '家政保洁',
          service_area: '未来小区'
        }
      ]),
      orders: createMemoryOrders([
        {
          _id: 'order_match',
          status: 'pending_accept',
          worker_id: '',
          category_name: '家政保洁',
          community: '未来小区'
        },
        {
          _id: 'order_wrong_category',
          status: 'pending_accept',
          worker_id: '',
          category_name: '家电维修',
          community: '未来小区'
        },
        {
          _id: 'order_wrong_area',
          status: 'pending_accept',
          worker_id: '',
          category_name: '家政保洁',
          community: '阳光小区'
        }
      ]),
      users: createMemoryUsers(),
      now: fixedNow
    }
  )

  assert.equal(result.success, true)
  assert.deepEqual(
    result.data.orders.map((order) => order._id),
    ['order_match']
  )
})

test('review create failure does not complete order', async () => {
  const { handleReview } = require('../cloudfunctions/review/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_review',
      user_id: 'openid_user',
      worker_id: 'openid_worker',
      service_id: 'svc_home_daily_clean',
      service_name: '日常保洁',
      status: 'pending_review'
    }
  ])

  const result = await handleReview(
    { action: 'createReview', orderId: 'order_review', rating: 5, content: '很好' },
    {
      openid: 'openid_user',
      orders,
      reviews: createMemoryReviews([], { failCreate: true }),
      now: fixedNow
    }
  )

  assert.equal(result.success, false)
  assert.equal(orders.records[0].status, 'pending_review')
})

test('admin status update writes operation log and rejects invalid transition', async () => {
  const { handleAdmin } = require('../cloudfunctions/admin/handler')
  const logs = createMemoryLogs()
  const env = {
    openid: 'openid_admin',
    users: createMemoryUsers([
      { _id: 'admin_1', openid: 'openid_admin', role: 'admin', status: 'normal' }
    ]),
    orders: createMemoryOrders([
      { _id: 'order_1', status: 'pending_accept', price: 9900 }
    ]),
    adminOperationLogs: logs,
    now: fixedNow
  }

  const invalidResult = await handleAdmin(
    {
      action: 'adminUpdateOrderStatus',
      orderId: 'order_1',
      status: 'completed',
      reason: '误操作测试'
    },
    env
  )

  assert.equal(invalidResult.success, false)
  assert.equal(invalidResult.errorCode, 'ORDER_STATUS_TRANSITION_INVALID')
  assert.equal(logs.records.length, 0)

  const updateResult = await handleAdmin(
    {
      action: 'adminUpdateOrderStatus',
      orderId: 'order_1',
      status: 'canceled',
      reason: '用户取消'
    },
    env
  )

  assert.equal(updateResult.success, true)
  assert.equal(logs.records.length, 1)
  assert.equal(logs.records[0].admin_id, 'openid_admin')
  assert.equal(logs.records[0].order_id, 'order_1')
  assert.equal(logs.records[0].from_status, 'pending_accept')
  assert.equal(logs.records[0].to_status, 'canceled')
  assert.equal(logs.records[0].reason, '用户取消')
})

test('cloud function wx-server-sdk dependencies are pinned', () => {
  const packageFiles = fs
    .readdirSync(path.join(rootDir, 'cloudfunctions'), { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(rootDir, 'cloudfunctions', entry.name, 'package.json'))
    .filter((filePath) => fs.existsSync(filePath))

  for (const packageFile of packageFiles) {
    const packageJson = JSON.parse(fs.readFileSync(packageFile, 'utf8'))
    assert.notEqual(packageJson.dependencies['wx-server-sdk'], 'latest', packageFile)
    assert.match(packageJson.dependencies['wx-server-sdk'], /^\d+\.\d+\.\d+$/, packageFile)
  }
})
