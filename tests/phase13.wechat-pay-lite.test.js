const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function fixedNow() {
  return new Date('2026-05-31T10:00:00.000Z')
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath))
}

function createMemoryOrders(initialOrders = []) {
  const records = initialOrders.map((order) => ({ ...order }))
  return {
    records,
    async findById(id) {
      const order = records.find((item) => item._id === id)
      return order ? { ...order } : null
    },
    async findByOutTradeNo(outTradeNo) {
      const order = records.find((item) => item.out_trade_no === outTradeNo)
      return order ? { ...order } : null
    },
    async updateById(id, data) {
      const order = records.find((item) => item._id === id)
      if (!order) return null
      Object.assign(order, data)
      return { ...order }
    },
    async markPaidIfUnpaid(id, data) {
      const order = records.find((item) => item._id === id)
      if (!order || order.pay_status === 'paid') return null
      Object.assign(order, data)
      return { ...order }
    }
  }
}

function createMemoryLogs() {
  const records = []
  return {
    records,
    async create(data) {
      const record = { ...data, _id: `payment_log_${records.length + 1}` }
      records.push(record)
      return { ...record }
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

function createWechatPayClient() {
  return {
    async createPrepay(order) {
      return {
        prepay_id: `prepay_${order._id}`,
        out_trade_no: order.out_trade_no,
        payParams: {
          timeStamp: '1780000000',
          nonceStr: 'nonce_test',
          package: `prepay_id=prepay_${order._id}`,
          signType: 'RSA',
          paySign: 'pay_sign_test'
        }
      }
    }
  }
}

test('wechat pay docs and config declare payment logs without secrets', () => {
  assert.equal(exists('docs/wechat-pay-setup.md'), true)
  assert.equal(exists('docs/wechat-pay-config.example.md'), true)
  assert.equal(exists('cloudfunctions/payment/config.example.js'), true)

  const setup = read('docs/wechat-pay-setup.md')
  const checklist = read('docs/release-package-checklist.md')
  const constants = read('miniprogram/config/constants.js')

  assert.match(setup, /payment_logs/)
  assert.match(setup, /APIv3/)
  assert.match(setup, /notify_url/)
  assert.match(checklist, /payment_logs/)
  assert.match(constants, /PAYMENT_LOGS/)
  assert.match(constants, /PAYMENT/)
})

test('payment cloud function creates prepay only for payable own orders', async () => {
  const { handlePayment } = require('../cloudfunctions/payment/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_payable',
      order_no: 'OD001',
      user_id: 'openid_user',
      status: 'pending_pay',
      pay_status: 'unpaid',
      price: 1299
    },
    {
      _id: 'order_paid',
      order_no: 'OD002',
      user_id: 'openid_user',
      status: 'pending_accept',
      pay_status: 'paid',
      price: 1299
    },
    {
      _id: 'order_canceled',
      order_no: 'OD003',
      user_id: 'openid_user',
      status: 'canceled',
      pay_status: 'unpaid',
      price: 1299
    }
  ])
  const paymentLogs = createMemoryLogs()
  const env = {
    openid: 'openid_user',
    now: fixedNow,
    payMode: 'wechat',
    orders,
    paymentLogs,
    wechatPayClient: createWechatPayClient()
  }

  const payableResult = await handlePayment({ action: 'createPayment', orderId: 'order_payable' }, env)
  assert.equal(payableResult.success, true)
  assert.equal(payableResult.data.payParams.package, 'prepay_id=prepay_order_payable')
  assert.equal(payableResult.data.amount, 1299)
  assert.equal(orders.records[0].pay_status, 'paying')
  assert.equal(orders.records[0].pay_amount, 1299)
  assert.match(orders.records[0].out_trade_no, /^OD001$/)
  assert.equal(paymentLogs.records.some((log) => log.type === 'create_prepay'), true)

  const paidResult = await handlePayment({ action: 'createPayment', orderId: 'order_paid' }, env)
  assert.equal(paidResult.success, false)
  assert.equal(paidResult.errorCode, 'ORDER_ALREADY_PAID')

  const canceledResult = await handlePayment({ action: 'createPayment', orderId: 'order_canceled' }, env)
  assert.equal(canceledResult.success, false)
  assert.equal(canceledResult.errorCode, 'ORDER_STATUS_INVALID')
})

test('payment create uses backend amount and rejects disabled real pay mode', async () => {
  const { handlePayment } = require('../cloudfunctions/payment/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_1',
      order_no: 'OD100',
      user_id: 'openid_user',
      status: 'pending_pay',
      pay_status: 'unpaid',
      price: 8800
    }
  ])

  const disabledResult = await handlePayment({
    action: 'createPayment',
    orderId: 'order_1',
    amount: 1
  }, {
    openid: 'openid_user',
    now: fixedNow,
    payMode: 'mock',
    orders,
    paymentLogs: createMemoryLogs(),
    wechatPayClient: createWechatPayClient()
  })
  assert.equal(disabledResult.success, false)
  assert.equal(disabledResult.errorCode, 'REAL_PAY_DISABLED')

  const enabledResult = await handlePayment({
    action: 'createPayment',
    orderId: 'order_1',
    amount: 1
  }, {
    openid: 'openid_user',
    now: fixedNow,
    payMode: 'wechat',
    orders,
    paymentLogs: createMemoryLogs(),
    wechatPayClient: createWechatPayClient()
  })
  assert.equal(enabledResult.success, true)
  assert.equal(enabledResult.data.amount, 8800)
})

test('payment notify marks order paid once and creates one user message', async () => {
  const { handlePayment } = require('../cloudfunctions/payment/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_1',
      order_no: 'OD200',
      user_id: 'openid_user',
      out_trade_no: 'OD200',
      status: 'pending_pay',
      pay_status: 'paying',
      pay_amount: 6600,
      price: 6600
    }
  ])
  const paymentLogs = createMemoryLogs()
  const messages = createMemoryMessages()
  const env = {
    now: fixedNow,
    orders,
    paymentLogs,
    messages
  }
  const notifyPayload = {
    out_trade_no: 'OD200',
    transaction_id: '4200000001',
    trade_state: 'SUCCESS',
    amount: { payer_total: 6600 }
  }

  const firstResult = await handlePayment({
    action: 'handlePayNotify',
    notify: notifyPayload
  }, env)
  assert.equal(firstResult.success, true)
  assert.equal(firstResult.data.order.status, 'pending_accept')
  assert.equal(firstResult.data.order.pay_status, 'paid')
  assert.equal(orders.records[0].transaction_id, '4200000001')
  assert.equal(messages.records.length, 1)
  assert.equal(messages.records[0].type, 'order_created')

  const duplicateResult = await handlePayment({
    action: 'handlePayNotify',
    notify: notifyPayload
  }, env)
  assert.equal(duplicateResult.success, true)
  assert.equal(duplicateResult.data.duplicate, true)
  assert.equal(messages.records.length, 1)
  assert.equal(paymentLogs.records.some((log) => log.type === 'duplicate_notify'), true)
})

test('payment status query is limited to current user order ownership', async () => {
  const { handlePayment } = require('../cloudfunctions/payment/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_own',
      order_no: 'OD301',
      user_id: 'openid_user',
      status: 'pending_accept',
      pay_status: 'paid',
      pay_amount: 6600,
      price: 6600
    },
    {
      _id: 'order_other',
      order_no: 'OD302',
      user_id: 'openid_other',
      status: 'pending_accept',
      pay_status: 'paid',
      pay_amount: 8800,
      price: 8800
    }
  ])
  const paymentLogs = createMemoryLogs()

  const ownResult = await handlePayment({
    action: 'queryPaymentStatus',
    orderId: 'order_own'
  }, {
    openid: 'openid_user',
    now: fixedNow,
    orders,
    paymentLogs
  })
  assert.equal(ownResult.success, true)
  assert.equal(ownResult.data.order._id, 'order_own')
  assert.equal(paymentLogs.records.some((log) => log.type === 'query_payment'), true)

  const otherResult = await handlePayment({
    action: 'queryPaymentStatus',
    orderId: 'order_other'
  }, {
    openid: 'openid_user',
    now: fixedNow,
    orders,
    paymentLogs
  })
  assert.equal(otherResult.success, false)
  assert.equal(otherResult.errorCode, 'PERMISSION_DENIED')

  const missingResult = await handlePayment({
    action: 'queryPaymentStatus',
    orderId: 'order_missing'
  }, {
    openid: 'openid_user',
    now: fixedNow,
    orders,
    paymentLogs
  })
  assert.equal(missingResult.success, false)
  assert.equal(missingResult.errorCode, 'ORDER_NOT_FOUND')
})

test('payment pages and services are wired while mock payment remains available', () => {
  const appJson = read('miniprogram/app.json')
  const orderDetailJs = read('miniprogram/pages/order-detail/order-detail.js')
  const orderDetailWxml = read('miniprogram/pages/order-detail/order-detail.wxml')
  const paymentService = read('miniprogram/services/payment.service.js')
  const orderService = read('miniprogram/services/order.service.js')
  const paymentConfig = read('miniprogram/config/payment.js')

  assert.match(appJson, /pages\/pay-result\/pay-result/)
  assert.equal(exists('miniprogram/pages/pay-result/pay-result.js'), true)
  assert.match(paymentConfig, /PAY_MODE/)
  assert.match(paymentConfig, /MOCK/)
  assert.match(paymentConfig, /WECHAT/)
  assert.match(paymentService, /createPayment/)
  assert.match(paymentService, /queryPaymentStatus/)
  assert.match(orderService, /mockPayOrder/)
  assert.match(orderDetailJs, /handlePay/)
  assert.match(orderDetailJs, /requestPayment/)
  assert.match(orderDetailJs, /mockPayOrder/)
  assert.match(orderDetailWxml, /bindtap="handlePay"/)
})

test('payment secrets are not present in miniprogram frontend files', () => {
  function listFiles(directory) {
    return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
      const fullPath = path.join(directory, entry.name)
      return entry.isDirectory() ? listFiles(fullPath) : [fullPath]
    })
  }

  const frontendFiles = listFiles(path.join(rootDir, 'miniprogram'))

  const content = frontendFiles.map((file) => fs.readFileSync(file, 'utf8')).join('\n')
  assert.doesNotMatch(content, /BEGIN (RSA )?PRIVATE KEY/)
  assert.doesNotMatch(content, /api[_-]?v3[_-]?key\s*[:=]\s*['"][^'"]+/i)
  assert.doesNotMatch(content, /mchid\s*[:=]\s*['"]\d{8,}/i)
})
