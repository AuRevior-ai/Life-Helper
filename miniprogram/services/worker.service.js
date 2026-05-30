const { CLOUD_FUNCTIONS } = require('../config/constants')
const { createActionService } = require('./_base.service')

module.exports = createActionService(CLOUD_FUNCTIONS.WORKER, [
  'applyWorker',
  'getWorkerInfo',
  'getAuditStatus',
  'getWorkerApplyList',
  'approveWorker',
  'rejectWorker',
  'disableWorker',
  'enableWorker',
  'getOrderHallList',
  'getWorkerDetail',
  'adminGetWorkerDetail'
])
