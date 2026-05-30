const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function fixedNow() {
  return new Date('2026-05-30T12:30:00.000Z')
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

    async findByUserId(userId) {
      return records
        .filter((order) => order.user_id === userId)
        .map((order) => ({ ...order }))
    },

    async findByWorkerId(workerId) {
      return records
        .filter((order) => order.worker_id === workerId)
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
    }
  }
}

function createMemoryReviews(initialReviews = []) {
  const records = initialReviews.map((review) => ({ ...review }))

  return {
    records,

    async findByOrderId(orderId) {
      const review = records.find((item) => item.order_id === orderId)
      return review ? { ...review } : null
    },

    async findByWorkerId(workerId) {
      return records
        .filter((review) => review.worker_id === workerId)
        .map((review) => ({ ...review }))
    },

    async create(data) {
      const record = {
        ...data,
        _id: `review_${records.length + 1}`
      }
      records.push(record)
      return { ...record }
    }
  }
}

test('startService moves assigned accepted order to serving', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_accepted',
      user_id: 'openid_user',
      worker_id: 'openid_worker',
      service_name: '日常保洁',
      status: 'accepted',
      pay_status: 'paid',
      price: 9900
    }
  ])

  const result = await handleOrder(
    {
      action: 'startService',
      orderId: 'order_accepted'
    },
    {
      openid: 'openid_worker',
      workers: createMemoryWorkers([
        {
          user_id: 'openid_worker',
          audit_status: 'approved',
          status: 'enabled'
        }
      ]),
      orders,
      now: fixedNow
    }
  )

  assert.equal(result.success, true)
  assert.equal(result.data.order.status, 'serving')
  assert.equal(result.data.order.started_at.toISOString(), '2026-05-30T12:30:00.000Z')
})

test('finishService moves assigned serving order to pending review', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_serving',
      user_id: 'openid_user',
      worker_id: 'openid_worker',
      service_name: '日常保洁',
      status: 'serving',
      pay_status: 'paid',
      price: 9900
    }
  ])

  const result = await handleOrder(
    {
      action: 'finishService',
      orderId: 'order_serving'
    },
    {
      openid: 'openid_worker',
      workers: createMemoryWorkers([
        {
          user_id: 'openid_worker',
          audit_status: 'approved',
          status: 'enabled'
        }
      ]),
      orders,
      now: fixedNow
    }
  )

  assert.equal(result.success, true)
  assert.equal(result.data.order.status, 'pending_review')
  assert.equal(result.data.order.finished_at.toISOString(), '2026-05-30T12:30:00.000Z')
})

test('createReview creates review and completes user pending-review order', async () => {
  const { handleReview } = require('../cloudfunctions/review/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_review',
      user_id: 'openid_user',
      worker_id: 'openid_worker',
      service_id: 'svc_home_daily_clean',
      service_name: '日常保洁',
      status: 'pending_review',
      pay_status: 'paid',
      price: 9900
    }
  ])
  const reviews = createMemoryReviews()

  const result = await handleReview(
    {
      action: 'createReview',
      orderId: 'order_review',
      rating: 5,
      content: '服务很准时'
    },
    {
      openid: 'openid_user',
      orders,
      reviews,
      now: fixedNow
    }
  )

  assert.equal(result.success, true)
  assert.equal(result.data.review._id, 'review_1')
  assert.equal(result.data.review.order_id, 'order_review')
  assert.equal(result.data.review.user_id, 'openid_user')
  assert.equal(result.data.review.worker_id, 'openid_worker')
  assert.equal(result.data.review.rating, 5)
  assert.equal(result.data.review.content, '服务很准时')
  assert.equal(orders.records.find((order) => order._id === 'order_review').status, 'completed')
  assert.equal(orders.records.find((order) => order._id === 'order_review').reviewed_at.toISOString(), '2026-05-30T12:30:00.000Z')
})

test('createReview rejects duplicate review for same order', async () => {
  const { handleReview } = require('../cloudfunctions/review/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_review',
      user_id: 'openid_user',
      worker_id: 'openid_worker',
      service_id: 'svc_home_daily_clean',
      service_name: '日常保洁',
      status: 'pending_review',
      pay_status: 'paid',
      price: 9900
    }
  ])
  const reviews = createMemoryReviews([
    {
      _id: 'review_existing',
      order_id: 'order_review',
      user_id: 'openid_user',
      worker_id: 'openid_worker',
      rating: 4,
      content: '已经评价'
    }
  ])

  const result = await handleReview(
    {
      action: 'createReview',
      orderId: 'order_review',
      rating: 5,
      content: '重复评价'
    },
    {
      openid: 'openid_user',
      orders,
      reviews,
      now: fixedNow
    }
  )

  assert.equal(result.success, false)
  assert.equal(result.errorCode, 'REVIEW_ALREADY_EXISTS')
  assert.equal(reviews.records.length, 1)
})

test('getWorkerIncomeStats summarizes completed orders for current worker', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_completed_1',
      worker_id: 'openid_worker',
      status: 'completed',
      price: 9900
    },
    {
      _id: 'order_completed_2',
      worker_id: 'openid_worker',
      status: 'completed',
      price: 6900
    },
    {
      _id: 'order_serving',
      worker_id: 'openid_worker',
      status: 'serving',
      price: 4900
    },
    {
      _id: 'order_other',
      worker_id: 'openid_other',
      status: 'completed',
      price: 19900
    }
  ])

  const result = await handleOrder(
    { action: 'getWorkerIncomeStats' },
    {
      openid: 'openid_worker',
      workers: createMemoryWorkers([
        {
          user_id: 'openid_worker',
          audit_status: 'approved',
          status: 'enabled'
        }
      ]),
      orders,
      now: fixedNow
    }
  )

  assert.equal(result.success, true)
  assert.equal(result.data.completed_count, 2)
  assert.equal(result.data.total_amount, 16800)
})

test('review and closing pages are wired to phase six services', () => {
  const workerDetailJs = fs.readFileSync(
    path.join(rootDir, 'miniprogram/pages/worker/order-detail/order-detail.js'),
    'utf8'
  )
  const workerDetailWxml = fs.readFileSync(
    path.join(rootDir, 'miniprogram/pages/worker/order-detail/order-detail.wxml'),
    'utf8'
  )
  const reviewJs = fs.readFileSync(
    path.join(rootDir, 'miniprogram/pages/review/review.js'),
    'utf8'
  )
  const reviewWxml = fs.readFileSync(
    path.join(rootDir, 'miniprogram/pages/review/review.wxml'),
    'utf8'
  )
  const userOrderDetailJs = fs.readFileSync(
    path.join(rootDir, 'miniprogram/pages/order-detail/order-detail.js'),
    'utf8'
  )
  const userOrderDetailWxml = fs.readFileSync(
    path.join(rootDir, 'miniprogram/pages/order-detail/order-detail.wxml'),
    'utf8'
  )
  const incomeJs = fs.readFileSync(
    path.join(rootDir, 'miniprogram/pages/worker/income/income.js'),
    'utf8'
  )
  const incomeWxml = fs.readFileSync(
    path.join(rootDir, 'miniprogram/pages/worker/income/income.wxml'),
    'utf8'
  )

  assert.match(workerDetailJs, /startService/)
  assert.match(workerDetailJs, /finishService/)
  assert.match(workerDetailWxml, /开始服务/)
  assert.match(workerDetailWxml, /完成服务/)
  assert.match(reviewJs, /createReview/)
  assert.match(reviewWxml, /评分/)
  assert.match(reviewWxml, /提交评价/)
  assert.match(userOrderDetailJs, /goReview/)
  assert.match(userOrderDetailWxml, /去评价/)
  assert.match(incomeJs, /getWorkerIncomeStats/)
  assert.match(incomeWxml, /累计收入/)
})
