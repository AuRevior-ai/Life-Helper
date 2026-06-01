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

function createMemoryCollection(initialRecords = []) {
  const records = initialRecords.map((record) => ({ ...record }))
  return {
    records,
    async findAll() {
      return records.map((record) => ({ ...record }))
    },
    async findById(id) {
      const record = records.find((item) => item._id === id)
      return record ? { ...record } : null
    },
    async create(data) {
      const record = { ...data, _id: data._id || `id_${records.length + 1}` }
      records.push(record)
      return { ...record }
    },
    async updateById(id, data) {
      const record = records.find((item) => item._id === id)
      if (!record) return null
      Object.assign(record, data)
      return { ...record }
    }
  }
}

function createMemoryUsers(initialUsers = []) {
  const collection = createMemoryCollection(initialUsers)
  return {
    ...collection,
    async findByOpenid(openid) {
      const user = collection.records.find((item) => item.openid === openid)
      return user ? { ...user } : null
    }
  }
}

function createMemoryMerchants(initialMerchants = []) {
  const collection = createMemoryCollection(initialMerchants)
  return {
    ...collection,
    async findByUserId(userId) {
      const merchant = collection.records.find((item) => item.user_id === userId)
      return merchant ? { ...merchant } : null
    },
    async findByAuditStatus(status) {
      return collection.records.filter((item) => item.audit_status === status).map((item) => ({ ...item }))
    }
  }
}

function createMemoryMerchantServices(initialServices = []) {
  const collection = createMemoryCollection(initialServices)
  return {
    ...collection,
    async findByMerchantId(merchantId) {
      return collection.records.filter((item) => item.merchant_id === merchantId).map((item) => ({ ...item }))
    }
  }
}

function createMemoryServiceProviders(initialProviders = []) {
  const collection = createMemoryCollection(initialProviders)
  return {
    ...collection,
    async findByRef(providerType, refId) {
      const provider = collection.records.find((item) => item.provider_type === providerType && item.ref_id === refId)
      return provider ? { ...provider } : null
    },
    async upsertByRef(providerType, refId, data) {
      const existing = collection.records.find((item) => item.provider_type === providerType && item.ref_id === refId)
      if (existing) {
        Object.assign(existing, data)
        return { ...existing }
      }
      return collection.create({ ...data, provider_type: providerType, ref_id: refId })
    },
    async findAvailableMerchants() {
      return collection.records
        .filter((item) => item.provider_type === 'merchant' && item.audit_status === 'approved' && item.status === 'normal')
        .map((item) => ({ ...item }))
    }
  }
}

function createMemoryMerchantLogs(initialLogs = []) {
  return createMemoryCollection(initialLogs)
}

function createMemoryMessages(initialMessages = []) {
  return createMemoryCollection(initialMessages)
}

function createMemoryOrders(initialOrders = []) {
  const collection = createMemoryCollection(initialOrders)
  return {
    ...collection,
    async findByUserId(userId) {
      return collection.records.filter((order) => order.user_id === userId).map((order) => ({ ...order }))
    },
    async findByWorkerId(workerId) {
      return collection.records.filter((order) => order.worker_id === workerId).map((order) => ({ ...order }))
    },
    async findByMerchantId(merchantId) {
      return collection.records.filter((order) => order.merchant_id === merchantId).map((order) => ({ ...order }))
    },
    async findByStatus(status) {
      return collection.records.filter((order) => order.status === status).map((order) => ({ ...order }))
    },
    async acceptPendingOrder(id, workerId, data) {
      const record = collection.records.find((order) => order._id === id)
      if (!record || record.status !== 'pending_accept' || record.worker_id) return null
      Object.assign(record, data, { worker_id: workerId })
      return { ...record }
    }
  }
}

function createMemoryWorkers(initialWorkers = []) {
  const collection = createMemoryCollection(initialWorkers)
  return {
    ...collection,
    async findByUserId(userId) {
      const worker = collection.records.find((item) => item.user_id === userId)
      return worker ? { ...worker } : null
    }
  }
}

function createMemoryFinanceLogs(initialLogs = []) {
  return {
    ...createMemoryCollection(initialLogs),
    async findByOrderId(orderId) {
      return this.records.filter((log) => log.order_id === orderId).map((log) => ({ ...log }))
    }
  }
}

function createMemoryWorkerEarnings(initialEarnings = []) {
  const collection = createMemoryCollection(initialEarnings)
  return {
    ...collection,
    async findByOrderId(orderId) {
      return collection.records.filter((earning) => earning.order_id === orderId).map((earning) => ({ ...earning }))
    },
    async findActiveByOrderId(orderId) {
      return collection.records.find((earning) => earning.order_id === orderId && earning.status !== 'reversed') || null
    },
    async findByWorkerId(workerId) {
      return collection.records.filter((earning) => earning.worker_id === workerId).map((earning) => ({ ...earning }))
    }
  }
}

function merchantEnv(overrides = {}) {
  return {
    openid: 'openid_merchant',
    users: createMemoryUsers([
      { _id: 'user_merchant', openid: 'openid_merchant', role: 'user', status: 'normal' },
      { _id: 'user_admin', openid: 'openid_admin', role: 'admin', status: 'normal' }
    ]),
    merchants: createMemoryMerchants(),
    merchantServices: createMemoryMerchantServices(),
    serviceProviders: createMemoryServiceProviders(),
    merchantLogs: createMemoryMerchantLogs(),
    messages: createMemoryMessages(),
    orders: createMemoryOrders(),
    services: createMemoryCollection([
      {
        _id: 'svc_clean',
        name: '日常保洁',
        category_id: 'cat_clean',
        category_name: '家政保洁',
        price: 9900,
        duration: '2小时',
        description: '基础保洁',
        cover_image: 'cloud://service-cover'
      }
    ]),
    now: fixedNow,
    ...overrides
  }
}

test('merchant apply, admin audit, and service provider sync are isolated by permission', async () => {
  const { handleMerchant } = require('../cloudfunctions/merchant/handler')
  const env = merchantEnv()

  const applyResult = await handleMerchant({
    action: 'applyMerchant',
    storeName: '未来家政店',
    contactName: '王店长',
    contactPhone: '13800138000',
    storeIntro: '社区便民服务',
    serviceCategoryIds: ['cat_clean'],
    serviceCommunities: ['未来小区'],
    fullAddress: '杭州市未来小区1号',
    businessHours: '09:00-20:00'
  }, env)

  assert.equal(applyResult.success, true)
  assert.equal(applyResult.data.merchant.audit_status, 'pending')
  assert.equal(env.merchantLogs.records[0].action, 'apply')

  const duplicateResult = await handleMerchant({ action: 'applyMerchant', storeName: '重复店铺' }, env)
  assert.equal(duplicateResult.success, false)
  assert.equal(duplicateResult.errorCode, 'MERCHANT_ALREADY_APPLIED')

  const denyResult = await handleMerchant({ action: 'adminApproveMerchant', merchantId: applyResult.data.merchant._id }, env)
  assert.equal(denyResult.success, false)
  assert.equal(denyResult.errorCode, 'PERMISSION_DENIED')

  const approveResult = await handleMerchant({
    action: 'adminApproveMerchant',
    merchantId: applyResult.data.merchant._id
  }, { ...env, openid: 'openid_admin' })

  assert.equal(approveResult.success, true)
  assert.equal(approveResult.data.merchant.audit_status, 'approved')
  assert.equal(approveResult.data.provider.provider_type, 'merchant')
  assert.equal(approveResult.data.provider.display_name, '未来家政店')
  assert.equal(env.serviceProviders.records.length, 1)
  assert.equal(env.messages.records.at(-1).type, 'merchant_approved')

  const rejectEnv = merchantEnv({
    merchants: createMemoryMerchants([
      { _id: 'merchant_reject', user_id: 'openid_other', store_name: '待拒绝店', audit_status: 'pending', status: 'disabled' }
    ])
  })
  const rejectResult = await handleMerchant({
    action: 'adminRejectMerchant',
    merchantId: 'merchant_reject',
    reason: '资料不完整'
  }, { ...rejectEnv, openid: 'openid_admin' })
  assert.equal(rejectResult.success, true)
  assert.equal(rejectResult.data.merchant.audit_status, 'rejected')
  assert.equal(rejectResult.data.merchant.reject_reason, '资料不完整')
})

test('merchant service configuration and public store pages expose only approved normal stores', async () => {
  const { handleMerchant } = require('../cloudfunctions/merchant/handler')
  const env = merchantEnv({
    merchants: createMemoryMerchants([
      {
        _id: 'merchant_1',
        user_id: 'openid_merchant',
        store_name: '未来家政店',
        contact_phone: '13800138000',
        audit_status: 'approved',
        status: 'normal',
        service_category_ids: ['cat_clean'],
        service_communities: ['未来小区']
      },
      {
        _id: 'merchant_disabled',
        user_id: 'openid_disabled',
        store_name: '停用店',
        audit_status: 'approved',
        status: 'disabled'
      }
    ]),
    serviceProviders: createMemoryServiceProviders([
      {
        _id: 'provider_1',
        provider_type: 'merchant',
        ref_id: 'merchant_1',
        user_id: 'openid_merchant',
        display_name: '未来家政店',
        audit_status: 'approved',
        status: 'normal'
      },
      {
        _id: 'provider_disabled',
        provider_type: 'merchant',
        ref_id: 'merchant_disabled',
        user_id: 'openid_disabled',
        display_name: '停用店',
        audit_status: 'approved',
        status: 'disabled'
      }
    ])
  })

  const serviceResult = await handleMerchant({
    action: 'createMerchantService',
    serviceId: 'svc_clean',
    price: 8800
  }, env)
  assert.equal(serviceResult.success, true)
  assert.equal(serviceResult.data.merchantService.price, 8800)
  assert.equal(serviceResult.data.merchantService.status, 'on')

  const storeListResult = await handleMerchant({ action: 'getStoreList' }, { ...env, openid: 'openid_user' })
  assert.equal(storeListResult.success, true)
  assert.deepEqual(storeListResult.data.list.map((store) => store._id), ['merchant_1'])

  const storeDetailResult = await handleMerchant({
    action: 'getStoreDetail',
    merchantId: 'merchant_1'
  }, { ...env, openid: 'openid_user' })
  assert.equal(storeDetailResult.success, true)
  assert.equal(storeDetailResult.data.merchant.store_name, '未来家政店')
  assert.equal(storeDetailResult.data.services[0].price, 8800)

  const disabledDetailResult = await handleMerchant({
    action: 'getStoreDetail',
    merchantId: 'merchant_disabled'
  }, { ...env, openid: 'openid_user' })
  assert.equal(disabledDetailResult.success, false)
  assert.equal(disabledDetailResult.errorCode, 'MERCHANT_NOT_AVAILABLE')

  const disableServiceResult = await handleMerchant({
    action: 'disableMerchantService',
    merchantServiceId: serviceResult.data.merchantService._id
  }, env)
  assert.equal(disableServiceResult.success, true)
  assert.equal(disableServiceResult.data.merchantService.status, 'off')
})

test('user creates merchant order and worker hall does not expose merchant orders', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const { handleWorker } = require('../cloudfunctions/worker/handler')
  const orders = createMemoryOrders()
  const merchantService = {
    _id: 'merchant_service_1',
    merchant_id: 'merchant_1',
    provider_id: 'provider_1',
    service_id: 'svc_clean',
    service_name: '日常保洁',
    category_id: 'cat_clean',
    category_name: '家政保洁',
    price: 8800,
    duration: '2小时',
    status: 'on'
  }
  const env = {
    openid: 'openid_user',
    addresses: {
      async findById() {
        return {
          _id: 'addr_1',
          user_id: 'openid_user',
          contact_name: '李雷',
          phone: '13800138000',
          city: '杭州',
          community: '未来小区',
          detail_address: '1幢101'
        }
      }
    },
    orders,
    merchantServices: {
      async findById(id) {
        return id === 'merchant_service_1' ? { ...merchantService } : null
      }
    },
    merchants: {
      async findById() {
        return {
          _id: 'merchant_1',
          user_id: 'openid_merchant',
          store_name: '未来家政店',
          store_logo: 'cloud://logo',
          contact_phone: '13800138000',
          audit_status: 'approved',
          status: 'normal'
        }
      }
    },
    serviceProviders: {
      async findById() {
        return {
          _id: 'provider_1',
          provider_type: 'merchant',
          ref_id: 'merchant_1',
          display_name: '未来家政店',
          phone: '13800138000',
          audit_status: 'approved',
          status: 'normal'
        }
      }
    },
    promotion: {
      async calculateOrderPromotion({ service }) {
        return {
          success: true,
          data: {
            original_amount: service.price,
            member_discount_amount: 0,
            coupon_discount_amount: 0,
            total_discount_amount: 0,
            payable_amount: service.price,
            promotion_source: 'none',
            member_snapshot: { level: '', discount_rate: 0, member_plan_id: '' },
            coupon_snapshot: { user_coupon_id: '', coupon_template_id: '', coupon_name: '', type: '', amount: 0, discount_rate: 0, threshold_amount: 0 }
          }
        }
      }
    },
    now: fixedNow,
    orderNoFactory: () => 'OD_MERCHANT_1'
  }

  const createResult = await handleOrder({
    action: 'createOrder',
    merchantServiceId: 'merchant_service_1',
    addressId: 'addr_1',
    appointmentDate: '2026-06-02',
    appointmentSlot: '09:00-11:00'
  }, env)

  assert.equal(createResult.success, true)
  assert.equal(createResult.data.order.provider_type, 'merchant')
  assert.equal(createResult.data.order.merchant_id, 'merchant_1')
  assert.equal(createResult.data.order.provider_snapshot.store_name, '未来家政店')
  assert.equal(createResult.data.order.merchant_service_snapshot.price, 8800)
  assert.equal(createResult.data.order.pay_amount, 8800)

  await handleOrder({ action: 'mockPayOrder', orderId: createResult.data.order._id }, {
    openid: 'openid_user',
    orders,
    messages: createMemoryMessages(),
    now: fixedNow
  })

  const hallResult = await handleWorker({ action: 'getOrderHallList' }, {
    openid: 'openid_worker',
    workers: createMemoryWorkers([{ user_id: 'openid_worker', audit_status: 'approved', status: 'enabled', online_status: 'available', service_category: '家政保洁', service_communities: ['未来小区'] }]),
    orders,
    now: fixedNow
  })
  assert.equal(hallResult.success, true)
  assert.equal(hallResult.data.orders.length, 0)

  const acceptResult = await handleOrder({ action: 'acceptOrder', orderId: createResult.data.order._id }, {
    openid: 'openid_worker',
    workers: createMemoryWorkers([{ user_id: 'openid_worker', audit_status: 'approved', status: 'enabled', online_status: 'available' }]),
    orders,
    now: fixedNow
  })
  assert.equal(acceptResult.success, false)
  assert.equal(acceptResult.errorCode, 'ORDER_PROVIDER_INVALID')
})

test('merchant can operate own merchant order and finance records provider compatibility', async () => {
  const { handleMerchant } = require('../cloudfunctions/merchant/handler')
  const { handleFinance } = require('../cloudfunctions/finance/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_1',
      order_no: 'OD_MERCHANT_1',
      user_id: 'openid_user',
      worker_id: '',
      merchant_id: 'merchant_1',
      provider_id: 'provider_1',
      provider_type: 'merchant',
      provider_snapshot: { provider_name: '未来家政店', store_name: '未来家政店' },
      status: 'pending_accept',
      pay_status: 'paid',
      service_name: '日常保洁',
      price: 8800,
      pay_amount: 8800
    }
  ])
  const env = merchantEnv({
    openid: 'openid_merchant',
    merchants: createMemoryMerchants([
      { _id: 'merchant_1', user_id: 'openid_merchant', store_name: '未来家政店', audit_status: 'approved', status: 'normal' },
      { _id: 'merchant_other', user_id: 'openid_other', store_name: '其他店', audit_status: 'approved', status: 'normal' }
    ]),
    orders,
    merchantLogs: createMemoryMerchantLogs(),
    messages: createMemoryMessages()
  })

  const listResult = await handleMerchant({ action: 'getMerchantOrderList' }, env)
  assert.equal(listResult.success, true)
  assert.deepEqual(listResult.data.list.map((order) => order._id), ['order_1'])

  const otherResult = await handleMerchant({ action: 'getMerchantOrderDetail', orderId: 'order_1' }, { ...env, openid: 'openid_other' })
  assert.equal(otherResult.success, false)
  assert.equal(otherResult.errorCode, 'PERMISSION_DENIED')

  const acceptResult = await handleMerchant({ action: 'merchantAcceptOrder', orderId: 'order_1' }, env)
  assert.equal(acceptResult.success, true)
  assert.equal(acceptResult.data.order.status, 'accepted')

  const startResult = await handleMerchant({ action: 'merchantStartService', orderId: 'order_1' }, env)
  assert.equal(startResult.success, true)
  assert.equal(startResult.data.order.status, 'serving')

  const finishResult = await handleMerchant({
    action: 'merchantFinishService',
    orderId: 'order_1',
    finishRemark: '商家服务完成',
    finishImages: ['cloud://finish']
  }, env)
  assert.equal(finishResult.success, true)
  assert.equal(finishResult.data.order.status, 'pending_review')
  assert.equal(env.merchantLogs.records.some((log) => log.action === 'finish_service'), true)

  await orders.updateById('order_1', { status: 'completed' })
  const financeLogs = createMemoryFinanceLogs()
  const workerEarnings = createMemoryWorkerEarnings()
  const financeResult = await handleFinance({ action: 'generateOrderFinance', orderId: 'order_1' }, {
    openid: 'system',
    orders,
    financeLogs,
    workerEarnings,
    now: fixedNow
  })

  assert.equal(financeResult.success, true)
  assert.equal(financeLogs.records[0].provider_type, 'merchant')
  assert.equal(financeLogs.records[0].merchant_id, 'merchant_1')
  assert.equal(workerEarnings.records[0].provider_type, 'merchant')
  assert.equal(workerEarnings.records[0].merchant_id, 'merchant_1')
})

test('phase 19 routes, constants, services, docs, and package are wired', () => {
  const appJson = read('miniprogram/app.json')
  const constants = read('miniprogram/config/constants.js')
  const status = read('miniprogram/config/status.js')
  const merchantService = read('miniprogram/services/merchant.service.js')
  const doc = read('docs/dev-records/19-merchant-store-service-provider.md')
  const packageJson = read('cloudfunctions/merchant/package.json')

  assert.match(appJson, /pages\/merchant\/store-list\/store-list/)
  assert.match(appJson, /pages\/merchant\/store-detail\/store-detail/)
  assert.match(appJson, /pages\/merchant\/apply\/apply/)
  assert.match(appJson, /pages\/merchant\/order-detail\/order-detail/)
  assert.match(appJson, /pages\/admin\/merchant-list\/merchant-list/)
  assert.match(appJson, /pages\/admin\/merchant-detail\/merchant-detail/)
  assert.match(constants, /MERCHANT: 'merchant'/)
  assert.match(constants, /SERVICE_PROVIDERS/)
  assert.match(status, /SERVICE_PROVIDER_TYPE/)
  assert.match(status, /MERCHANT_AUDIT_STATUS/)
  assert.match(status, /MERCHANT_SERVICE_STATUS/)
  assert.match(merchantService, /applyMerchant/)
  assert.match(merchantService, /adminApproveMerchant/)
  assert.match(doc, /阶段 19/)
  assert.match(doc, /service_providers/)
  assert.match(packageJson, /3\.0\.1/)
})
