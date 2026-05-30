const { CLOUD_FUNCTIONS } = require('../config/constants')
const { createActionService } = require('./_base.service')

module.exports = createActionService(CLOUD_FUNCTIONS.SERVICE, [
  'getCategoryList',
  'createCategory',
  'updateCategory',
  'deleteCategory',
  'getServiceList',
  'getServiceDetail',
  'createService',
  'updateService',
  'updateServiceStatus',
  'deleteService'
])
