const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')
const test = require('node:test')

const rootDir = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
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

function createMemoryAreas(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async findAll() {
      return records.map((item) => ({ ...item }))
    },
    async findEnabled() {
      return records.filter((item) => item.status === 'enabled').map((item) => ({ ...item }))
    },
    async findById(id) {
      const area = records.find((item) => item._id === id)
      return area ? { ...area } : null
    },
    async create(data) {
      const area = {
        ...data,
        _id: `area_${records.length + 1}`
      }
      records.push(area)
      return { ...area }
    },
    async updateById(id, data) {
      const area = records.find((item) => item._id === id)
      if (!area) return null
      Object.assign(area, data)
      return { ...area }
    }
  }
}

function createMemoryAddresses(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async findById(id) {
      const address = records.find((item) => item._id === id)
      return address ? { ...address } : null
    },
    async findByUserId(userId) {
      return records.filter((item) => item.user_id === userId).map((item) => ({ ...item }))
    },
    async create(data) {
      const address = { ...data, _id: `address_${records.length + 1}` }
      records.push(address)
      return { ...address }
    },
    async updateById(id, data) {
      const address = records.find((item) => item._id === id)
      if (!address) return null
      Object.assign(address, data)
      return { ...address }
    },
    async clearDefaultForUser(userId, updatedAt) {
      records
        .filter((item) => item.user_id === userId && item.is_default)
        .forEach((item) => {
          item.is_default = false
          item.updated_at = updatedAt
        })
    }
  }
}

function createMemoryOrders(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async findAll() {
      return records.map((item) => ({ ...item }))
    },
    async findById(id) {
      const order = records.find((item) => item._id === id)
      return order ? { ...order } : null
    },
    async findByStatus(status) {
      return records.filter((item) => item.status === status).map((item) => ({ ...item }))
    },
    async create(data) {
      const order = { ...data, _id: `order_${records.length + 1}` }
      records.push(order)
      return { ...order }
    },
    async updateById(id, data) {
      const order = records.find((item) => item._id === id)
      if (!order) return null
      Object.assign(order, data)
      return { ...order }
    },
    async acceptPendingOrder(id, workerId, data) {
      const order = records.find((item) => item._id === id)
      if (!order || order.status !== 'pending_accept' || order.worker_id) return null
      Object.assign(order, data, { worker_id: workerId })
      return { ...order }
    }
  }
}

function createMemoryWorkers(initial = []) {
  const records = initial.map((item) => ({ ...item }))
  return {
    records,
    async findAll() {
      return records.map((item) => ({ ...item }))
    },
    async findById(id) {
      const worker = records.find((item) => item._id === id)
      return worker ? { ...worker } : null
    },
    async findByUserId(userId) {
      const worker = records.find((item) => item.user_id === userId)
      return worker ? { ...worker } : null
    },
    async findByAuditStatus(status) {
      return records.filter((item) => item.audit_status === status).map((item) => ({ ...item }))
    },
    async create(data) {
      const worker = { ...data, _id: `worker_${records.length + 1}` }
      records.push(worker)
      return { ...worker }
    },
    async updateById(id, data) {
      const worker = records.find((item) => item._id === id)
      if (!worker) return null
      Object.assign(worker, data)
      return { ...worker }
    }
  }
}

function createMemoryLogs() {
  const records = []
  return {
    records,
    async create(data) {
      const log = { ...data, _id: `log_${records.length + 1}` }
      records.push(log)
      return { ...log }
    },
    async findByOrderId(orderId) {
      return records.filter((item) => item.order_id === orderId).map((item) => ({ ...item }))
    }
  }
}

function createMemoryMessages() {
  const records = []
  return {
    records,
    async create(data) {
      const message = { ...data, _id: `message_${records.length + 1}` }
      records.push(message)
      return { ...message }
    }
  }
}

test('admin manages service areas and users only see enabled areas', async () => {
  const { handleArea } = require('../cloudfunctions/area/handler')
  const areas = createMemoryAreas()
  const env = {
    openid: 'openid_admin',
    now: () => new Date('2026-05-31T08:00:00.000Z'),
    users: createMemoryUsers([{ openid: 'openid_admin', role: 'admin', status: 'normal' }]),
    areas
  }

  const createResult = await handleArea({
    action: 'adminCreateServiceArea',
    city: '杭州',
    district: '西湖区',
    street: '古荡街道',
    community: '未来小区',
    sort: 10
  }, env)

  assert.equal(createResult.success, true)
  assert.equal(createResult.data.area.full_name, '杭州 西湖区 古荡街道 未来小区')
  assert.equal(createResult.data.area.status, 'enabled')

  const disableResult = await handleArea({
    action: 'adminDisableServiceArea',
    areaId: createResult.data.area._id
  }, env)
  assert.equal(disableResult.data.area.status, 'disabled')

  const userListResult = await handleArea({ action: 'getServiceAreaList' }, {
    openid: 'openid_user',
    users: createMemoryUsers([{ openid: 'openid_user', role: 'user', status: 'normal' }]),
    areas
  })
  assert.deepEqual(userListResult.data.areas, [])

  const adminListResult = await handleArea({ action: 'getServiceAreaList', includeDisabled: true }, env)
  assert.equal(adminListResult.data.areas.length, 1)
})

test('address and order save structured service area snapshots', async () => {
  const { handleAddress } = require('../cloudfunctions/address/handler')
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const areas = createMemoryAreas([
    {
      _id: 'area_1',
      city: '杭州',
      district: '西湖区',
      street: '古荡街道',
      community: '未来小区',
      full_name: '杭州 西湖区 古荡街道 未来小区',
      status: 'enabled'
    },
    {
      _id: 'area_disabled',
      city: '杭州',
      district: '拱墅区',
      street: '湖墅街道',
      community: '停用小区',
      full_name: '杭州 拱墅区 湖墅街道 停用小区',
      status: 'disabled'
    }
  ])
  const addresses = createMemoryAddresses()
  const now = () => new Date('2026-05-31T08:00:00.000Z')

  const disabledResult = await handleAddress({
    action: 'createAddress',
    contact_name: '张三',
    phone: '13800138000',
    service_area_id: 'area_disabled',
    detail_address: '1 幢 101'
  }, {
    openid: 'openid_user',
    now,
    addresses,
    areas
  })
  assert.equal(disabledResult.success, false)
  assert.equal(disabledResult.errorCode, 'SERVICE_AREA_DISABLED')

  const addressResult = await handleAddress({
    action: 'createAddress',
    contact_name: '张三',
    phone: '13800138000',
    service_area_id: 'area_1',
    detail_address: '1 幢 101',
    is_default: true
  }, {
    openid: 'openid_user',
    now,
    addresses,
    areas
  })
  assert.equal(addressResult.success, true)
  assert.equal(addressResult.data.address.district, '西湖区')
  assert.equal(addressResult.data.address.street, '古荡街道')
  assert.equal(addressResult.data.address.community, '未来小区')
  assert.equal(addressResult.data.address.full_address, '杭州 西湖区 古荡街道 未来小区 1 幢 101')

  const orders = createMemoryOrders()
  const orderResult = await handleOrder({
    action: 'createOrder',
    serviceId: 'svc_clean',
    addressId: addressResult.data.address._id,
    appointment_date: '2026-06-01',
    appointment_slot: '09:00-11:00'
  }, {
    openid: 'openid_user',
    now,
    addresses,
    orders,
    services: {
      async findById() {
        return {
          _id: 'svc_clean',
          name: '日常保洁',
          duration: '2小时',
          category_id: 'cleaning',
          category_name: '保洁',
          price: 9900
        }
      }
    }
  })

  assert.equal(orderResult.success, true)
  assert.equal(orderResult.data.order.service_area_id, 'area_1')
  assert.equal(orderResult.data.order.district, '西湖区')
  assert.equal(orderResult.data.order.full_address, '杭州 西湖区 古荡街道 未来小区 1 幢 101')
})

test('worker area config and online status control order hall visibility', async () => {
  const { handleWorker } = require('../cloudfunctions/worker/handler')
  const areas = createMemoryAreas([
    { _id: 'area_a', community: '未来小区', full_name: '杭州 西湖区 古荡街道 未来小区', status: 'enabled' },
    { _id: 'area_b', community: '星河小区', full_name: '杭州 西湖区 文新街道 星河小区', status: 'enabled' }
  ])
  const workers = createMemoryWorkers([
    {
      _id: 'worker_1',
      user_id: 'openid_worker',
      name: '王师傅',
      audit_status: 'approved',
      status: 'enabled',
      service_category: '保洁',
      service_area_ids: ['area_a'],
      service_communities: ['未来小区'],
      online_status: 'available'
    }
  ])
  const orders = createMemoryOrders([
    { _id: 'order_a', status: 'pending_accept', worker_id: '', category_name: '保洁', community: '未来小区', service_area_id: 'area_a' },
    { _id: 'order_b', status: 'pending_accept', worker_id: '', category_name: '保洁', community: '星河小区', service_area_id: 'area_b' },
    { _id: 'order_c', status: 'pending_accept', worker_id: '', category_name: '维修', community: '未来小区', service_area_id: 'area_a' },
    { _id: 'order_legacy', status: 'pending_accept', worker_id: '', category_name: '保洁' }
  ])
  const baseEnv = {
    openid: 'openid_worker',
    workers,
    orders,
    areas
  }

  const visibleResult = await handleWorker({ action: 'getOrderHallList' }, baseEnv)
  assert.equal(visibleResult.success, true)
  assert.deepEqual(visibleResult.data.orders.map((item) => item._id), ['order_a'])

  const pauseResult = await handleWorker({
    action: 'updateWorkerOnlineStatus',
    online_status: 'paused'
  }, baseEnv)
  assert.equal(pauseResult.data.worker.online_status, 'paused')

  const pausedList = await handleWorker({ action: 'getOrderHallList' }, baseEnv)
  assert.deepEqual(pausedList.data.orders, [])

  const areaResult = await handleWorker({
    action: 'updateWorkerServiceAreas',
    service_area_ids: ['area_a', 'area_b']
  }, baseEnv)
  assert.deepEqual(areaResult.data.worker.service_communities, ['未来小区', '星河小区'])
})

test('admin assigns and unassigns only matching available workers with logs and messages', async () => {
  const { handleDispatch } = require('../cloudfunctions/dispatch/handler')
  const orders = createMemoryOrders([
    {
      _id: 'order_1',
      order_no: 'OD001',
      user_id: 'openid_user',
      status: 'pending_accept',
      worker_id: '',
      category_name: '保洁',
      community: '未来小区',
      service_area_id: 'area_1'
    },
    {
      _id: 'order_serving',
      order_no: 'OD002',
      user_id: 'openid_user',
      status: 'serving',
      worker_id: 'openid_worker'
    }
  ])
  const workers = createMemoryWorkers([
    {
      _id: 'worker_match',
      user_id: 'openid_worker',
      name: '王师傅',
      audit_status: 'approved',
      status: 'enabled',
      service_category: '保洁',
      service_area_ids: ['area_1'],
      service_communities: ['未来小区'],
      online_status: 'available'
    },
    {
      _id: 'worker_wrong_area',
      user_id: 'openid_other_worker',
      name: '李师傅',
      audit_status: 'approved',
      status: 'enabled',
      service_category: '保洁',
      service_area_ids: ['area_2'],
      service_communities: ['星河小区'],
      online_status: 'available'
    }
  ])
  const dispatchLogs = createMemoryLogs()
  const adminOperationLogs = createMemoryLogs()
  const messages = createMemoryMessages()
  const env = {
    openid: 'openid_admin',
    now: () => new Date('2026-05-31T09:00:00.000Z'),
    users: createMemoryUsers([{ openid: 'openid_admin', role: 'admin', status: 'normal' }]),
    orders,
    workers,
    dispatchLogs,
    adminOperationLogs,
    messages
  }

  const assignableResult = await handleDispatch({ action: 'getAssignableWorkers', orderId: 'order_1' }, env)
  assert.deepEqual(assignableResult.data.workers.map((item) => item._id), ['worker_match'])

  const wrongAssign = await handleDispatch({
    action: 'adminAssignOrder',
    orderId: 'order_1',
    workerId: 'worker_wrong_area',
    reason: '测试指派'
  }, env)
  assert.equal(wrongAssign.success, false)
  assert.equal(wrongAssign.errorCode, 'WORKER_NOT_ASSIGNABLE')

  const assignResult = await handleDispatch({
    action: 'adminAssignOrder',
    orderId: 'order_1',
    workerId: 'worker_match',
    reason: '人工派单'
  }, env)
  assert.equal(assignResult.success, true)
  assert.equal(assignResult.data.order.status, 'accepted')
  assert.equal(assignResult.data.order.worker_id, 'openid_worker')
  assert.equal(dispatchLogs.records[0].action, 'admin_assign')
  assert.equal(adminOperationLogs.records[0].reason, '人工派单')
  assert.equal(messages.records.length, 2)

  const unassignResult = await handleDispatch({
    action: 'adminUnassignOrder',
    orderId: 'order_1',
    reason: '师傅临时有事'
  }, env)
  assert.equal(unassignResult.success, true)
  assert.equal(unassignResult.data.order.status, 'pending_accept')
  assert.equal(unassignResult.data.order.worker_id, '')
  assert.equal(dispatchLogs.records[1].action, 'admin_unassign')

  const servingUnassign = await handleDispatch({
    action: 'adminUnassignOrder',
    orderId: 'order_serving',
    reason: '测试'
  }, env)
  assert.equal(servingUnassign.success, false)
  assert.equal(servingUnassign.errorCode, 'ORDER_STATUS_INVALID')

  const userResult = await handleDispatch({ action: 'getAssignableWorkers', orderId: 'order_1' }, {
    ...env,
    openid: 'openid_user',
    users: createMemoryUsers([{ openid: 'openid_user', role: 'user', status: 'normal' }])
  })
  assert.equal(userResult.success, false)
  assert.equal(userResult.errorCode, 'PERMISSION_DENIED')
})

test('worker active accept writes dispatch log', async () => {
  const { handleOrder } = require('../cloudfunctions/order/handler')
  const dispatchLogs = createMemoryLogs()
  const messages = createMemoryMessages()
  const orders = createMemoryOrders([
    {
      _id: 'order_1',
      order_no: 'OD001',
      user_id: 'openid_user',
      status: 'pending_accept',
      worker_id: '',
      category_name: '保洁',
      community: '未来小区'
    }
  ])

  const result = await handleOrder({ action: 'acceptOrder', orderId: 'order_1' }, {
    openid: 'openid_worker',
    now: () => new Date('2026-05-31T10:00:00.000Z'),
    orders,
    workers: createMemoryWorkers([
      {
        _id: 'worker_1',
        user_id: 'openid_worker',
        audit_status: 'approved',
        status: 'enabled',
        online_status: 'available'
      }
    ]),
    messages,
    dispatchLogs
  })

  assert.equal(result.success, true)
  assert.equal(dispatchLogs.records[0].action, 'worker_accept')
  assert.equal(dispatchLogs.records[0].to_worker_id, 'openid_worker')
})

test('phase 15 routes, services, constants, and docs are wired', () => {
  const app = JSON.parse(read('miniprogram/app.json'))
  const constants = read('miniprogram/config/constants.js')
  const status = read('miniprogram/config/status.js')
  const workerService = read('miniprogram/services/worker.service.js')
  const orderHallJs = read('miniprogram/pages/worker/order-hall/order-hall.js')
  const adminOrderDetailJs = read('miniprogram/pages/admin/order-detail/order-detail.js')
  const readme = read('README.md')
  const index = read('docs/dev-records/index.md')

  for (const route of [
    'pages/admin/area-list/area-list',
    'pages/admin/area-edit/area-edit',
    'pages/admin/assign-worker/assign-worker',
    'pages/admin/dispatch-logs/dispatch-logs'
  ]) {
    assert.ok(app.pages.includes(route), `${route} should be registered`)
  }

  assert.match(constants, /AREA: 'area'/)
  assert.match(constants, /DISPATCH: 'dispatch'/)
  assert.match(constants, /SERVICE_AREAS: 'service_areas'/)
  assert.match(constants, /DISPATCH_LOGS: 'dispatch_logs'/)
  assert.match(status, /WORKER_ONLINE_STATUS/)
  assert.match(status, /DISPATCH_ACTION/)
  assert.match(workerService, /updateWorkerOnlineStatus/)
  assert.match(workerService, /updateWorkerServiceAreas/)
  assert.match(orderHallJs, /online_status/)
  assert.match(adminOrderDetailJs, /goAssignWorker/)
  assert.match(readme, /服务区域配置/)
  assert.match(index, /15_service-area-dispatch-v1/)
})
