const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function fixedNow() {
  return new Date('2026-05-30T20:00:00.000Z')
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function createMemoryUsers(initialUsers = []) {
  const records = initialUsers.map((user) => ({ ...user }))
  return {
    records,
    async findByOpenid(openid) {
      const user = records.find((item) => item.openid === openid)
      return user ? { ...user } : null
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
    async findById(id) {
      const worker = records.find((item) => item._id === id)
      return worker ? { ...worker } : null
    },
    async findByUserId(userId) {
      const worker = records.find((item) => item.user_id === userId)
      return worker ? { ...worker } : null
    },
    async findByAuditStatus(status) {
      return records.filter((worker) => worker.audit_status === status).map((worker) => ({ ...worker }))
    }
  }
}

function createMemoryOrders(initialOrders = []) {
  const records = initialOrders.map((order) => ({ ...order }))
  return {
    records,
    async findByWorkerId(workerId) {
      return records.filter((order) => order.worker_id === workerId).map((order) => ({ ...order }))
    },
    async findByServiceId(serviceId) {
      return records.filter((order) => order.service_id === serviceId).map((order) => ({ ...order }))
    }
  }
}

function createMemoryReviews(initialReviews = []) {
  const records = initialReviews.map((review) => ({ ...review }))
  return {
    records,
    async findByWorkerId(workerId) {
      return records.filter((review) => review.worker_id === workerId).map((review) => ({ ...review }))
    }
  }
}

function createMemoryCollection(initialRecords = []) {
  const records = initialRecords.map((record) => ({ ...record }))
  return {
    records,
    async findAll() {
      return records.map((record) => ({ ...record }))
    },
    async create(data) {
      const record = { ...data, _id: data._id || `record_${records.length + 1}` }
      records.push(record)
      return { ...record }
    },
    async updateById(id, data) {
      const record = records.find((item) => item._id === id)
      if (!record) return null
      Object.assign(record, data)
      return { ...record }
    },
    async deleteById(id) {
      const index = records.findIndex((item) => item._id === id)
      if (index < 0) return false
      records.splice(index, 1)
      return true
    }
  }
}

test('message list page marks order messages read and routes by role', () => {
  const messageListJs = read('miniprogram/pages/message-list/message-list.js')
  const messageListWxml = read('miniprogram/pages/message-list/message-list.wxml')

  assert.match(messageListJs, /handleMessageTap/)
  assert.match(messageListJs, /markMessageRead/)
  assert.match(messageListJs, /related_type/)
  assert.match(messageListJs, /pages\/order-detail\/order-detail/)
  assert.match(messageListJs, /pages\/worker\/order-detail\/order-detail/)
  assert.match(messageListWxml, /bindtap="handleMessageTap"/)
})

test('admin worker audit page exposes worker detail entry', () => {
  const workerAuditJs = read('miniprogram/pages/admin/worker-audit/worker-audit.js')
  const workerAuditWxml = read('miniprogram/pages/admin/worker-audit/worker-audit.wxml')
  const workerService = read('miniprogram/services/worker.service.js')

  assert.match(workerAuditJs, /goWorkerDetail/)
  assert.match(workerAuditWxml, /查看详情/)
  assert.match(workerService, /adminGetWorkerDetail/)
})

test('adminGetWorkerDetail requires admin and returns worker stats', async () => {
  const { handleWorker } = require('../cloudfunctions/worker/handler')
  const env = {
    openid: 'openid_admin',
    users: createMemoryUsers([
      { _id: 'admin_1', openid: 'openid_admin', role: 'admin', status: 'normal' },
      { _id: 'user_1', openid: 'openid_user', role: 'user', status: 'normal' }
    ]),
    workers: createMemoryWorkers([
      { _id: 'worker_1', user_id: 'openid_worker', name: '王师傅', audit_status: 'approved' }
    ]),
    orders: createMemoryOrders([
      { _id: 'order_1', worker_id: 'openid_worker', status: 'completed' }
    ]),
    reviews: createMemoryReviews([
      { _id: 'review_1', worker_id: 'openid_worker', rating: 5 }
    ]),
    now: fixedNow
  }

  const adminResult = await handleWorker({ action: 'adminGetWorkerDetail', workerId: 'worker_1' }, env)
  assert.equal(adminResult.success, true)
  assert.equal(adminResult.data.completed_count, 1)
  assert.equal(adminResult.data.average_rating, 5)

  env.openid = 'openid_user'
  const userResult = await handleWorker({ action: 'adminGetWorkerDetail', workerId: 'worker_1' }, env)
  assert.equal(userResult.success, false)
  assert.equal(userResult.errorCode, 'PERMISSION_DENIED')
})

test('service category and service deletion are protected by related records', async () => {
  const { handleService } = require('../cloudfunctions/service/handler')
  const env = {
    openid: 'openid_admin',
    users: createMemoryUsers([
      { _id: 'admin_1', openid: 'openid_admin', role: 'admin', status: 'normal' }
    ]),
    categories: createMemoryCollection([
      { _id: 'cat_used', name: '有服务分类', status: 'enabled' },
      { _id: 'cat_empty', name: '空分类', status: 'enabled' }
    ]),
    services: createMemoryCollection([
      { _id: 'svc_used', category_id: 'cat_used', name: '已有订单服务', status: 'off' }
    ]),
    orders: createMemoryOrders([
      { _id: 'order_1', service_id: 'svc_used' }
    ]),
    now: fixedNow
  }

  const categoryResult = await handleService({ action: 'deleteCategory', categoryId: 'cat_used' }, env)
  assert.equal(categoryResult.success, false)
  assert.equal(categoryResult.errorCode, 'CATEGORY_HAS_SERVICES')

  const serviceResult = await handleService({ action: 'deleteService', serviceId: 'svc_used' }, env)
  assert.equal(serviceResult.success, false)
  assert.equal(serviceResult.errorCode, 'SERVICE_HAS_ORDERS')

  const emptyCategoryResult = await handleService({ action: 'deleteCategory', categoryId: 'cat_empty' }, env)
  assert.equal(emptyCategoryResult.success, true)
})

test('release and real environment docs exist with required sensitive file checklist', () => {
  const issues = read('docs/wechat-real-env-issues.md')
  const checklist = read('docs/release-package-checklist.md')
  const readme = read('README.md')

  assert.match(issues, /微信真实环境问题清单/)
  assert.match(issues, /ISSUE-001/)
  assert.match(checklist, /\.git\//)
  assert.match(checklist, /project\.private\.config\.json/)
  assert.match(checklist, /background\//)
  assert.match(checklist, /AppID/)
  assert.match(checklist, /openid/)
  assert.match(readme, /阶段十二/)
  assert.doesNotMatch(readme, /管理员初始化暂时采用手动方式/)
})
