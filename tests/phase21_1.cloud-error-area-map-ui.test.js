const test = require('node:test')
const assert = require('node:assert/strict')
const fs = require('node:fs')
const path = require('node:path')

const rootDir = path.resolve(__dirname, '..')

function read(relativePath) {
  return fs.readFileSync(path.join(rootDir, relativePath), 'utf8')
}

test('cloud function transport failures are converted to deployment guidance instead of business not-found copy', async () => {
  const previousWx = global.wx
  delete require.cache[require.resolve('../miniprogram/utils/request')]
  global.wx = {
    cloud: {
      async callFunction() {
        const error = new Error('cloud.callFunction:fail Error: errCode:-504002 function not found')
        error.errCode = -504002
        throw error
      }
    }
  }

  const { callCloudFunction } = require('../miniprogram/utils/request')
  await assert.rejects(
    () => callCloudFunction('service', 'getServiceDetail', { serviceId: 'svc_missing' }),
    (error) => {
      assert.equal(error.errorCode, 'CLOUD_FUNCTION_CALL_FAILED')
      assert.match(error.message, /service/)
      assert.match(error.message, /云函数/)
      assert.match(error.message, /上传并部署/)
      assert.doesNotMatch(error.message, /服务不存在|地址不存在/)
      return true
    }
  )

  global.wx = previousWx
  delete require.cache[require.resolve('../miniprogram/utils/request')]
})

test('service and order pages render cloud failure state separately from missing service state', () => {
  const serviceDetailJs = read('miniprogram/pages/service-detail/service-detail.js')
  const serviceDetailWxml = read('miniprogram/pages/service-detail/service-detail.wxml')
  const orderSubmitJs = read('miniprogram/pages/order-submit/order-submit.js')
  const orderSubmitWxml = read('miniprogram/pages/order-submit/order-submit.wxml')

  assert.match(serviceDetailJs, /loadError/)
  assert.match(serviceDetailWxml, /loadError/)
  assert.match(serviceDetailWxml, /加载失败/)
  assert.match(orderSubmitJs, /loadError/)
  assert.match(orderSubmitWxml, /loadError/)
  assert.match(orderSubmitWxml, /下单信息加载失败/)
})

test('admin area pages expose map center fields and coordinate editing for phase 21', () => {
  const areaListWxml = read('miniprogram/pages/admin/area-list/area-list.wxml')
  const areaEditJs = read('miniprogram/pages/admin/area-edit/area-edit.js')
  const areaEditWxml = read('miniprogram/pages/admin/area-edit/area-edit.wxml')

  assert.match(areaListWxml, /地图中心点/)
  assert.match(areaListWxml, /新增服务区域/)
  assert.match(areaEditJs, /latitude/)
  assert.match(areaEditJs, /longitude/)
  assert.match(areaEditJs, /adcode/)
  assert.match(areaEditJs, /map_poi_name/)
  assert.match(areaEditWxml, /中心点纬度/)
  assert.match(areaEditWxml, /中心点经度/)
  assert.match(areaEditWxml, /行政区编码/)
})
