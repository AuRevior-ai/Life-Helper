const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function fixedNow() {
  return new Date('2026-06-01T08:00:00.000Z')
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath))
}

function createMemoryUsers(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    async findByOpenid(openid) {
      const user = records.find((item) => item.openid === openid)
      return user ? { ...user } : null
    }
  }
}

function createMemoryOrders(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async findById(id) {
      const order = records.find((item) => item._id === id)
      return order ? { ...order } : null
    },
    async updateById(id, data) {
      const order = records.find((item) => item._id === id)
      if (!order) return null
      Object.assign(order, data)
      return { ...order }
    }
  }
}

function createMemoryFinanceLogs(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async create(data) {
      const record = { ...data, _id: `finance_log_${records.length + 1}` }
      records.push(record)
      return { ...record }
    },
    async findAll() {
      return records.map((item) => ({ ...item }))
    },
    async findByOrderId(orderId) {
      return records.filter((item) => item.order_id === orderId).map((item) => ({ ...item }))
    }
  }
}

function createMemoryWorkerEarnings(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async create(data) {
      const record = { ...data, _id: `earning_${records.length + 1}` }
      records.push(record)
      return { ...record }
    },
    async findActiveByOrderId(orderId) {
      const record = records.find((item) => item.order_id === orderId && item.status !== 'reversed')
      return record ? { ...record } : null
    },
    async findByOrderId(orderId) {
      return records.filter((item) => item.order_id === orderId).map((item) => ({ ...item }))
    },
    async findByWorkerId(workerId) {
      return records.filter((item) => item.worker_id === workerId).map((item) => ({ ...item }))
    },
    async findAll() {
      return records.map((item) => ({ ...item }))
    },
    async updateById(id, data) {
      const record = records.find((item) => item._id === id)
      if (!record) return null
      Object.assign(record, data)
      return { ...record }
    },
    async updateByOrderId(orderId, data) {
      const record = records.find((item) => item.order_id === orderId && item.status !== 'reversed')
      if (!record) return null
      Object.assign(record, data)
      return { ...record }
    }
  }
}

function createBaseEnv(openid = 'openid_admin') {
  return {
    openid,
    now: fixedNow,
    users: createMemoryUsers([
      { _id: 'user_1', openid: 'openid_user', role: 'user', status: 'normal' },
      { _id: 'worker_user', openid: 'openid_worker', role: 'worker', status: 'normal' },
      { _id: 'admin_1', openid: 'openid_admin', role: 'admin', status: 'normal' }
    ]),
    orders: createMemoryOrders([
      {
        _id: 'order_completed',
        order_no: 'OD001',
        user_id: 'openid_user',
        worker_id: 'openid_worker',
        status: 'completed',
        pay_status: 'paid',
        price: 10000,
        pay_amount: 10000,
        service_name: '日常保洁',
        appointment_time: '2026-06-02 09:00-11:00',
        finance_generated: false
      },
      {
        _id: 'order_unpaid',
        order_no: 'OD002',
        user_id: 'openid_user',
        worker_id: 'openid_worker',
        status: 'completed',
        pay_status: 'unpaid',
        price: 10000,
        pay_amount: 10000
      },
      {
        _id: 'order_pending',
        order_no: 'OD003',
        user_id: 'openid_user',
        worker_id: 'openid_worker',
        status: 'pending_review',
        pay_status: 'paid',
        price: 10000,
        pay_amount: 10000
      },
      {
        _id: 'order_without_worker',
        order_no: 'OD004',
        user_id: 'openid_user',
        worker_id: '',
        status: 'completed',
        pay_status: 'paid',
        price: 10000,
        pay_amount: 10000
      }
    ]),
    financeLogs: createMemoryFinanceLogs(),
    workerEarnings: createMemoryWorkerEarnings(),
    financeNoFactory: () => 'FN202606010001',
    earningNoFactory: () => 'EN202606010001'
  }
}

function createMemoryReviews(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async findByOrderId(orderId) {
      const review = records.find((item) => item.order_id === orderId)
      return review ? { ...review } : null
    },
    async create(data) {
      const record = { ...data, _id: `review_${records.length + 1}` }
      records.push(record)
      return { ...record }
    },
    async deleteById(id) {
      const index = records.findIndex((item) => item._id === id)
      if (index >= 0) records.splice(index, 1)
    }
  }
}

function createMemoryMessages() {
  const records = []
  return {
    records,
    async create(data) {
      const record = { ...data, _id: `message_${records.length + 1}` }
      records.push(record)
      return { ...record }
    }
  }
}

test('completed paid order generates finance logs and one frozen worker earning', async () => {
  const { handleFinance } = require('../cloudfunctions/finance/handler')
  const env = createBaseEnv()

  const result = await handleFinance({ action: 'generateOrderFinance', orderId: 'order_completed' }, env)

  assert.equal(result.success, true)
  assert.equal(result.data.already_generated, false)
  assert.equal(result.data.workerEarning.worker_earning_amount, 8500)
  assert.equal(result.data.workerEarning.platform_commission_amount, 1500)
  assert.equal(result.data.workerEarning.status, 'frozen')
  assert.equal(result.data.workerEarning.settlement_status, 'not_settled')
  assert.equal(env.financeLogs.records.length, 3)
  assert.deepEqual(env.financeLogs.records.map((item) => item.type), [
    'order_income',
    'platform_commission',
    'worker_earning'
  ])
  assert.equal(env.orders.records[0].finance_generated, true)
  assert.equal(env.orders.records[0].worker_earning_amount, 8500)
})

test('finance generation is idempotent and rejects invalid orders', async () => {
  const { handleFinance } = require('../cloudfunctions/finance/handler')
  const env = createBaseEnv()

  const firstResult = await handleFinance({ action: 'generateOrderFinance', orderId: 'order_completed' }, env)
  const secondResult = await handleFinance({ action: 'generateOrderFinance', orderId: 'order_completed' }, env)
  assert.equal(firstResult.success, true)
  assert.equal(secondResult.success, true)
  assert.equal(secondResult.data.already_generated, true)
  assert.equal(env.workerEarnings.records.length, 1)
  assert.equal(env.financeLogs.records.length, 3)

  const unpaidResult = await handleFinance({ action: 'generateOrderFinance', orderId: 'order_unpaid' }, env)
  assert.equal(unpaidResult.success, false)
  assert.equal(unpaidResult.errorCode, 'ORDER_NOT_PAID')

  const pendingResult = await handleFinance({ action: 'generateOrderFinance', orderId: 'order_pending' }, env)
  assert.equal(pendingResult.success, false)
  assert.equal(pendingResult.errorCode, 'ORDER_NOT_COMPLETED')

  const missingWorkerResult = await handleFinance({ action: 'generateOrderFinance', orderId: 'order_without_worker' }, env)
  assert.equal(missingWorkerResult.success, false)
  assert.equal(missingWorkerResult.errorCode, 'ORDER_WORKER_MISSING')
})

test('worker income summary and list are limited to current worker', async () => {
  const { handleFinance } = require('../cloudfunctions/finance/handler')
  const env = createBaseEnv('openid_worker')
  env.workerEarnings = createMemoryWorkerEarnings([
    {
      _id: 'earning_1',
      order_id: 'order_completed',
      order_no: 'OD001',
      worker_id: 'openid_worker',
      status: 'frozen',
      settlement_status: 'not_settled',
      worker_earning_amount: 8500,
      platform_commission_amount: 1500,
      service_name: '日常保洁'
    },
    {
      _id: 'earning_2',
      order_id: 'order_other',
      order_no: 'OD999',
      worker_id: 'openid_other_worker',
      status: 'settleable',
      settlement_status: 'settleable',
      worker_earning_amount: 3000,
      platform_commission_amount: 500
    }
  ])

  const summaryResult = await handleFinance({ action: 'getWorkerIncomeSummary' }, env)
  assert.equal(summaryResult.success, true)
  assert.equal(summaryResult.data.total_amount, 8500)
  assert.equal(summaryResult.data.frozen_amount, 8500)
  assert.equal(summaryResult.data.settleable_amount, 0)

  const listResult = await handleFinance({ action: 'getWorkerEarningList' }, env)
  assert.equal(listResult.success, true)
  assert.deepEqual(listResult.data.earnings.map((item) => item.worker_id), ['openid_worker'])
})

test('admin can read finance logs, worker earnings, and order finance detail', async () => {
  const { handleFinance } = require('../cloudfunctions/finance/handler')
  const env = createBaseEnv('openid_admin')
  await handleFinance({ action: 'generateOrderFinance', orderId: 'order_completed' }, env)

  const logsResult = await handleFinance({ action: 'adminGetFinanceLogs' }, env)
  assert.equal(logsResult.success, true)
  assert.equal(logsResult.data.logs.length, 3)

  const earningsResult = await handleFinance({ action: 'adminGetWorkerEarnings' }, env)
  assert.equal(earningsResult.success, true)
  assert.equal(earningsResult.data.earnings.length, 1)

  const detailResult = await handleFinance({
    action: 'adminGetOrderFinanceDetail',
    orderId: 'order_completed'
  }, env)
  assert.equal(detailResult.success, true)
  assert.equal(detailResult.data.order._id, 'order_completed')
  assert.equal(detailResult.data.logs.length, 3)

  const userResult = await handleFinance({ action: 'adminGetFinanceLogs' }, {
    ...env,
    openid: 'openid_user'
  })
  assert.equal(userResult.success, false)
  assert.equal(userResult.errorCode, 'PERMISSION_DENIED')
})

test('mock refund reverses unsettled earnings and settled earnings require manual handling', async () => {
  const { handleFinance } = require('../cloudfunctions/finance/handler')
  const env = createBaseEnv('openid_admin')
  await handleFinance({ action: 'generateOrderFinance', orderId: 'order_completed' }, env)

  const reverseResult = await handleFinance({
    action: 'reverseOrderFinance',
    orderId: 'order_completed',
    refundId: 'refund_1',
    refundAmount: 10000
  }, env)
  assert.equal(reverseResult.success, true)
  assert.equal(reverseResult.data.workerEarning.status, 'reversed')
  assert.equal(env.financeLogs.records.filter((item) => item.type === 'earning_reverse').length, 1)
  assert.equal(env.orders.records[0].finance_reverse_status, 'reversed')

  const duplicateResult = await handleFinance({
    action: 'reverseOrderFinance',
    orderId: 'order_completed',
    refundId: 'refund_1',
    refundAmount: 10000
  }, env)
  assert.equal(duplicateResult.success, true)
  assert.equal(duplicateResult.data.already_reversed, true)

  const settledEnv = createBaseEnv('openid_admin')
  settledEnv.workerEarnings = createMemoryWorkerEarnings([
    {
      _id: 'earning_settled',
      order_id: 'order_completed',
      order_no: 'OD001',
      user_id: 'openid_user',
      worker_id: 'openid_worker',
      status: 'settled',
      settlement_status: 'settled',
      worker_earning_amount: 8500,
      platform_commission_amount: 1500
    }
  ])
  const settledResult = await handleFinance({
    action: 'reverseOrderFinance',
    orderId: 'order_completed',
    refundId: 'refund_2',
    refundAmount: 10000
  }, settledEnv)
  assert.equal(settledResult.success, true)
  assert.equal(settledResult.data.workerEarning.status, 'pending_manual')
  assert.equal(settledResult.data.manual_required, true)
})

test('review completion triggers retryable finance generation', async () => {
  const { handleReview } = require('../cloudfunctions/review/handler')
  const calls = []
  const orders = createMemoryOrders([
    {
      _id: 'order_review',
      order_no: 'OD005',
      user_id: 'openid_user',
      worker_id: 'openid_worker',
      status: 'pending_review',
      pay_status: 'paid',
      price: 10000,
      pay_amount: 10000,
      service_id: 'svc_clean',
      service_name: '日常保洁'
    }
  ])
  orders.completePendingReviewOrder = async (id, data) => orders.updateById(id, data)

  const result = await handleReview({
    action: 'createReview',
    orderId: 'order_review',
    rating: 5,
    content: '服务不错'
  }, {
    openid: 'openid_user',
    now: fixedNow,
    orders,
    reviews: createMemoryReviews(),
    messages: createMemoryMessages(),
    finance: {
      async generateOrderFinance(payload) {
        calls.push(payload)
        return { success: true }
      }
    }
  })

  assert.equal(result.success, true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].orderId, 'order_review')
})

test('mock refund triggers retryable finance reversal', async () => {
  const { handleRefund } = require('../cloudfunctions/refund/handler')
  const calls = []
  const env = {
    openid: 'openid_admin',
    now: fixedNow,
    users: createMemoryUsers([{ openid: 'openid_admin', role: 'admin', status: 'normal' }]),
    orders: createMemoryOrders([
      {
        _id: 'order_refund',
        order_no: 'OD006',
        user_id: 'openid_user',
        worker_id: 'openid_worker',
        status: 'completed',
        pay_status: 'paid',
        price: 10000,
        pay_amount: 10000,
        refund_status: 'none'
      }
    ]),
    afterSales: {
      records: [
        {
          _id: 'after_sale_1',
          order_id: 'order_refund',
          order_no: 'OD006',
          user_id: 'openid_user',
          worker_id: 'openid_worker',
          amount: 10000,
          status: 'approved'
        }
      ],
      async findById(id) {
        const record = this.records.find((item) => item._id === id)
        return record ? { ...record } : null
      },
      async updateById(id, data) {
        const record = this.records.find((item) => item._id === id)
        Object.assign(record, data)
        return { ...record }
      }
    },
    refundLogs: {
      records: [],
      async create(data) {
        const record = { ...data, _id: `refund_log_${this.records.length + 1}` }
        this.records.push(record)
        return { ...record }
      }
    },
    messages: createMemoryMessages(),
    refundNoFactory: () => 'RF202606010001',
    finance: {
      async reverseOrderFinance(payload) {
        calls.push(payload)
        return { success: true }
      }
    }
  }

  const result = await handleRefund({ action: 'mockRefund', afterSaleId: 'after_sale_1' }, env)

  assert.equal(result.success, true)
  assert.equal(calls.length, 1)
  assert.equal(calls[0].orderId, 'order_refund')
  assert.equal(calls[0].refundAmount, 10000)
})

test('phase 16 services, pages, constants, and docs are wired', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const constants = read('miniprogram/config/constants.js')
  const status = read('miniprogram/config/status.js')
  const financeService = read('miniprogram/services/finance.service.js')
  const workerIncome = read('miniprogram/pages/worker/income/income.js')
  const dashboard = read('miniprogram/pages/admin/dashboard/dashboard.js')
  const index = read('docs/dev-records/index.md')
  const report = read('docs/dev-records/16_finance-worker-earning-base.md')

  for (const route of [
    'pages/admin/finance-log-list/finance-log-list',
    'pages/admin/worker-earning-list/worker-earning-list',
    'pages/admin/order-finance-detail/order-finance-detail'
  ]) {
    assert.ok(app.pages.includes(route), `${route} should be registered`)
  }

  assert.match(constants, /FINANCE: 'finance'/)
  assert.match(constants, /FINANCE_LOGS: 'finance_logs'/)
  assert.match(constants, /WORKER_EARNINGS: 'worker_earnings'/)
  assert.match(status, /FINANCE_LOG_TYPE/)
  assert.match(status, /WORKER_EARNING_STATUS/)
  assert.match(financeService, /getWorkerIncomeSummary/)
  assert.match(financeService, /adminGetFinanceLogs/)
  assert.match(workerIncome, /financeService/)
  assert.match(dashboard, /财务流水/)
  assert.match(dashboard, /finance-log-list\/finance-log-list/)
  assert.match(report, /finance_logs/)
  assert.match(index, /16_finance-worker-earning-base/)
  assert.equal(exists('cloudfunctions/finance/package.json'), true)
})
