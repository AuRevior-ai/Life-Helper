const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function fixedNow() {
  return new Date('2026-06-02T10:00:00.000Z')
}

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

function exists(relativePath) {
  return fs.existsSync(path.join(rootDir, relativePath))
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
    async findByStatus(status) {
      return records.filter((item) => item.status === status).map((item) => ({ ...item }))
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

function createMemoryAddresses(initialAddresses = []) {
  const collection = createMemoryCollection(initialAddresses)
  return {
    ...collection,
    async findByUserId(userId) {
      return collection.records.filter((item) => item.user_id === userId).map((item) => ({ ...item }))
    },
    async clearDefaultForUser(userId, updatedAt) {
      collection.records.filter((item) => item.user_id === userId).forEach((item) => {
        item.is_default = false
        item.updated_at = updatedAt
      })
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
    }
  }
}

test('shared LBS utilities calculate distance and match radius, admin area, and legacy text', () => {
  const {
    calculateDistanceKm,
    isWithinRadius,
    matchAdminArea,
    matchProviderServiceRange,
    sortProvidersByDistance,
    LBS_MATCH_RESULT
  } = require('../cloudfunctions/_shared/lbs-utils')

  const km = calculateDistanceKm(30.2741, 120.1551, 30.2841, 120.1551)
  assert.ok(km > 1 && km < 1.3)
  assert.equal(isWithinRadius({ latitude: 30.2741, longitude: 120.1551 }, { latitude: 30.2841, longitude: 120.1551 }, 2), true)
  assert.equal(isWithinRadius({ latitude: null, longitude: 120.1551 }, { latitude: 30.2841, longitude: 120.1551 }, 2), false)

  assert.equal(matchAdminArea({ adcode: '330106', community: '未来小区' }, { service_adcodes: ['330106'], service_communities: ['其他小区'] }).matched, true)
  assert.equal(matchAdminArea({ community: '未来小区' }, { service_communities: ['未来小区'] }).reason, LBS_MATCH_RESULT.LEGACY_COMPAT)
  assert.equal(matchAdminArea({ district: '西湖区' }, { service_districts: ['上城区'] }).matched, false)

  const radius = matchProviderServiceRange(
    { latitude: 30.2741, longitude: 120.1551, community: '未来小区' },
    { service_range_mode: 'radius', base_latitude: 30.2742, base_longitude: 120.1552, service_radius_km: 1 }
  )
  assert.equal(radius.matched, true)
  assert.equal(radius.match_type, 'radius')

  const fallback = matchProviderServiceRange(
    { community: '未来小区' },
    { service_range_mode: 'radius', service_radius_km: 1, service_communities: ['未来小区'] }
  )
  assert.equal(fallback.matched, true)
  assert.equal(fallback.match_type, 'legacy_text')
  assert.equal(fallback.reason, LBS_MATCH_RESULT.LEGACY_COMPAT)

  const sorted = sortProvidersByDistance({ latitude: 30.2741, longitude: 120.1551 }, [
    { _id: 'far', base_latitude: 30.3741, base_longitude: 120.1551 },
    { _id: 'missing' },
    { _id: 'near', base_latitude: 30.2751, base_longitude: 120.1551 }
  ])
  assert.deepEqual(sorted.map((item) => item._id), ['near', 'far', 'missing'])
})

test('address and order save latitude, longitude, POI, adcode, and address snapshot', async () => {
  const { handleAddress } = require('../cloudfunctions/address/handler')
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const addresses = createMemoryAddresses()
  const created = await handleAddress({
    action: 'createAddress',
    contact_name: '李雷',
    phone: '13800138000',
    city: '杭州',
    district: '西湖区',
    community: '未来小区',
    detail_address: '1 幢 101',
    latitude: 30.2741,
    longitude: 120.1551,
    map_address: '杭州市西湖区未来小区',
    map_poi_name: '未来小区东门',
    adcode: '330106',
    map_point_source: 'manual_pick',
    is_default: true
  }, { openid: 'openid_user', addresses, now: fixedNow })
  assert.equal(created.success, true)
  assert.equal(created.data.address.latitude, 30.2741)
  assert.equal(created.data.address.adcode, '330106')
  assert.equal(created.data.address.map_point_source, 'manual_pick')

  const orders = createMemoryCollection()
  const orderResult = await handleOrder({
    action: 'createOrder',
    serviceId: 'svc_clean',
    addressId: created.data.address._id,
    appointmentDate: '2026-06-03',
    appointmentSlot: '09:00-11:00'
  }, {
    openid: 'openid_user',
    addresses,
    orders,
    services: createMemoryCollection([{ _id: 'svc_clean', name: '日常保洁', category_id: 'cat_clean', category_name: '家政保洁', price: 9900 }]),
    now: fixedNow,
    orderNoFactory: () => 'OD_LBS_1'
  })
  assert.equal(orderResult.success, true)
  assert.equal(orderResult.data.order.latitude, 30.2741)
  assert.equal(orderResult.data.order.address_snapshot.latitude, 30.2741)
  assert.equal(orderResult.data.order.address_snapshot.map_poi_name, '未来小区东门')
})

test('service area stores map center fields and exposes map list action', async () => {
  const { handleArea } = require('../cloudfunctions/area/handler')
  const env = {
    openid: 'openid_admin',
    users: createMemoryUsers([{ openid: 'openid_admin', role: 'admin', status: 'normal' }]),
    areas: createMemoryCollection(),
    now: fixedNow
  }
  const created = await handleArea({
    action: 'adminCreateServiceArea',
    city: '杭州',
    district: '西湖区',
    community: '未来小区',
    latitude: 30.2741,
    longitude: 120.1551,
    center_latitude: 30.2741,
    center_longitude: 120.1551,
    adcode: '330106',
    map_poi_name: '未来小区中心'
  }, env)
  assert.equal(created.success, true)
  assert.equal(created.data.area.center_latitude, 30.2741)

  const updated = await handleArea({
    action: 'adminUpdateServiceAreaLocation',
    areaId: created.data.area._id,
    latitude: 30.275,
    longitude: 120.156,
    map_address: '更新后的中心点'
  }, env)
  assert.equal(updated.success, true)
  assert.equal(updated.data.area.map_address, '更新后的中心点')

  const mapList = await handleArea({ action: 'adminGetServiceAreaMapList', includeDisabled: true }, env)
  assert.equal(mapList.success, true)
  assert.equal(mapList.data.areas[0].latitude, 30.275)
})

test('worker service range supports radius mode and order hall filters by LBS while preserving legacy rules', async () => {
  const { handleWorker } = require('../cloudfunctions/worker/handler')
  const orders = createMemoryCollection([
    { _id: 'near_order', status: 'pending_accept', provider_type: 'worker', category_name: '家政保洁', community: '远方小区', latitude: 30.275, longitude: 120.155 },
    { _id: 'far_order', status: 'pending_accept', provider_type: 'worker', category_name: '家政保洁', community: '远方小区', latitude: 31.2, longitude: 121.4 },
    { _id: 'legacy_order', status: 'pending_accept', provider_type: 'worker', category_name: '家政保洁', community: '未来小区' },
    { _id: 'merchant_order', status: 'pending_accept', provider_type: 'merchant', merchant_id: 'merchant_1', category_name: '家政保洁', community: '未来小区' }
  ])
  const workers = createMemoryWorkers([
    {
      _id: 'worker_1',
      user_id: 'openid_worker',
      name: '王师傅',
      service_category: '家政保洁',
      audit_status: 'approved',
      status: 'enabled',
      online_status: 'available',
      service_range_mode: 'radius',
      base_latitude: 30.2741,
      base_longitude: 120.1551,
      service_radius_km: 2,
      service_communities: ['未来小区']
    }
  ])
  const result = await handleWorker({ action: 'getOrderHallList' }, { openid: 'openid_worker', workers, orders, now: fixedNow })
  assert.equal(result.success, true)
  assert.deepEqual(result.data.orders.map((order) => order._id), ['near_order', 'legacy_order'])
  assert.equal(result.data.orders[0].lbs_match.match_type, 'radius')
  assert.equal(result.data.orders[1].lbs_match.match_type, 'legacy_text')

  await workers.updateById('worker_1', { online_status: 'paused' })
  const paused = await handleWorker({ action: 'getOrderHallList' }, { openid: 'openid_worker', workers, orders, now: fixedNow })
  assert.equal(paused.data.orders.length, 0)
})

test('admin assignment filters candidates with LBS metadata and can include service providers', async () => {
  const { handleDispatch } = require('../cloudfunctions/dispatch/handler')
  const orders = createMemoryCollection([
    { _id: 'order_1', order_no: 'OD_LBS_2', status: 'pending_accept', category_name: '家政保洁', community: '未来小区', latitude: 30.2741, longitude: 120.1551 }
  ])
  const workers = createMemoryCollection([
    { _id: 'worker_1', user_id: 'openid_worker', name: '近处师傅', audit_status: 'approved', status: 'enabled', online_status: 'available', service_category: '家政保洁', service_range_mode: 'radius', base_latitude: 30.2742, base_longitude: 120.1552, service_radius_km: 1 },
    { _id: 'worker_far', user_id: 'openid_far', name: '远处师傅', audit_status: 'approved', status: 'enabled', online_status: 'available', service_category: '家政保洁', service_range_mode: 'radius', base_latitude: 31, base_longitude: 121, service_radius_km: 1 }
  ])
  const serviceProviders = createMemoryCollection([
    { _id: 'provider_merchant', provider_type: 'merchant', ref_id: 'merchant_1', display_name: '未来家政店', audit_status: 'approved', status: 'normal', online_status: 'available', service_category_ids: ['cat_clean'], service_communities: ['未来小区'], service_range_mode: 'admin_area' }
  ])
  const env = {
    openid: 'openid_admin',
    users: createMemoryUsers([{ openid: 'openid_admin', role: 'admin', status: 'normal' }]),
    orders,
    workers,
    serviceProviders,
    dispatchLogs: createMemoryCollection(),
    adminOperationLogs: createMemoryCollection(),
    messages: createMemoryCollection(),
    now: fixedNow
  }

  const assignable = await handleDispatch({ action: 'getAssignableWorkers', orderId: 'order_1' }, env)
  assert.equal(assignable.success, true)
  assert.deepEqual(assignable.data.workers.map((worker) => worker._id), ['worker_1'])
  assert.equal(assignable.data.workers[0].lbs_match.match_type, 'radius')

  const providers = await handleDispatch({ action: 'getAssignableProviders', orderId: 'order_1' }, env)
  assert.equal(providers.success, true)
  assert.deepEqual(providers.data.providers.map((provider) => provider._id), ['worker_1', 'provider_merchant'])
  assert.equal(providers.data.providers[1].lbs_match.match_type, 'legacy_text')
})

test('merchant store list sorts by distance and keeps stores without location last', async () => {
  const { handleMerchant } = require('../cloudfunctions/merchant/handler')
  const env = {
    openid: 'openid_user',
    merchants: createMemoryMerchants([
      { _id: 'merchant_far', user_id: 'openid_far', store_name: '远店', audit_status: 'approved', status: 'normal', base_latitude: 31, base_longitude: 121 },
      { _id: 'merchant_missing', user_id: 'openid_missing', store_name: '无坐标店', audit_status: 'approved', status: 'normal' },
      { _id: 'merchant_near', user_id: 'openid_near', store_name: '近店', audit_status: 'approved', status: 'normal', base_latitude: 30.275, base_longitude: 120.155 }
    ])
  }
  const result = await handleMerchant({ action: 'getStoreList', latitude: 30.2741, longitude: 120.1551 }, env)
  assert.equal(result.success, true)
  assert.deepEqual(result.data.list.map((merchant) => merchant._id), ['merchant_near', 'merchant_far', 'merchant_missing'])
  assert.equal(typeof result.data.list[0].distance_km, 'number')
})

test('phase 21 routes, constants, services, docs, and real-device checklist are wired', () => {
  const appJson = read('miniprogram/app.json')
  const status = read('miniprogram/config/status.js')
  const areaService = read('miniprogram/services/area.service.js')
  const workerService = read('miniprogram/services/worker.service.js')
  const docs = read('docs/map-lbs-setup.md') + read('docs/dev-records/21_lbs-map-service-area-v2.md') + read('README.md') + read('docs/release-package-checklist.md')
  const index = read('docs/dev-records/index.md')

  assert.match(appJson, /pages\/map\/pick-location\/pick-location/)
  assert.match(appJson, /pages\/provider\/service-range\/service-range/)
  assert.match(status, /SERVICE_RANGE_MODE/)
  assert.match(status, /MAP_POINT_SOURCE/)
  assert.match(status, /LBS_MATCH_RESULT/)
  assert.match(areaService, /adminUpdateServiceAreaLocation/)
  assert.match(workerService, /updateWorkerServiceRange/)

  for (const file of ['docs/map-lbs-setup.md', 'docs/dev-records/21_lbs-map-service-area-v2.md']) {
    assert.equal(exists(file), true, `${file} should exist`)
  }
  for (const snippet of ['地图 key', '真机测试', '半径模式', '行政区模式', '实时轨迹', '路径规划', 'ETA', '自动派单']) {
    assert.match(docs, new RegExp(snippet))
  }
  assert.match(index, /阶段 21/)
  assert.match(index, /已完成基础版/)
})
