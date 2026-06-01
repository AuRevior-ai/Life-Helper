const { CLOUD_FUNCTIONS } = require('../config/constants')
const { createActionService } = require('./_base.service')

module.exports = createActionService(CLOUD_FUNCTIONS.FINANCE, [
  'generateOrderFinance',
  'reverseOrderFinance',
  'getWorkerIncomeSummary',
  'getWorkerEarningList',
  'adminGetFinanceLogs',
  'adminGetWorkerEarnings',
  'adminGetOrderFinanceDetail',
  'mockUnlockSettlement'
])

