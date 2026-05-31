const ORDER_STATUS = Object.freeze({
  PENDING_PAY: 'pending_pay',
  PENDING_ACCEPT: 'pending_accept',
  ACCEPTED: 'accepted',
  SERVING: 'serving',
  PENDING_REVIEW: 'pending_review',
  COMPLETED: 'completed',
  CANCELED: 'canceled'
})

const ORDER_STATUS_TEXT = Object.freeze({
  [ORDER_STATUS.PENDING_PAY]: '待付款',
  [ORDER_STATUS.PENDING_ACCEPT]: '待接单',
  [ORDER_STATUS.ACCEPTED]: '已接单',
  [ORDER_STATUS.SERVING]: '服务中',
  [ORDER_STATUS.PENDING_REVIEW]: '待评价',
  [ORDER_STATUS.COMPLETED]: '已完成',
  [ORDER_STATUS.CANCELED]: '已取消'
})

const PAY_STATUS = Object.freeze({
  UNPAID: 'unpaid',
  PAYING: 'paying',
  PAID: 'paid',
  FAILED: 'failed',
  REFUNDED: 'refunded'
})

const PAY_STATUS_TEXT = Object.freeze({
  [PAY_STATUS.UNPAID]: '未支付',
  [PAY_STATUS.PAYING]: '支付中',
  [PAY_STATUS.PAID]: '已支付',
  [PAY_STATUS.FAILED]: '支付失败',
  [PAY_STATUS.REFUNDED]: '已退款'
})

const WORKER_AUDIT_STATUS = Object.freeze({
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected'
})

const WORKER_AUDIT_STATUS_TEXT = Object.freeze({
  [WORKER_AUDIT_STATUS.PENDING]: '待审核',
  [WORKER_AUDIT_STATUS.APPROVED]: '已通过',
  [WORKER_AUDIT_STATUS.REJECTED]: '已拒绝'
})

const COMMON_STATUS = Object.freeze({
  NORMAL: 'normal',
  DISABLED: 'disabled',
  ENABLED: 'enabled',
  ON: 'on',
  OFF: 'off'
})

const MESSAGE_TYPE = Object.freeze({
  ORDER_CREATED: 'order_created',
  ORDER_ACCEPTED: 'order_accepted',
  SERVICE_STARTED: 'service_started',
  SERVICE_FINISHED: 'service_finished',
  ORDER_COMPLETED: 'order_completed',
  WORKER_APPROVED: 'worker_approved',
  WORKER_REJECTED: 'worker_rejected',
  SYSTEM: 'system'
})

const MESSAGE_TYPE_TEXT = Object.freeze({
  [MESSAGE_TYPE.ORDER_CREATED]: '订单已提交',
  [MESSAGE_TYPE.ORDER_ACCEPTED]: '师傅已接单',
  [MESSAGE_TYPE.SERVICE_STARTED]: '服务已开始',
  [MESSAGE_TYPE.SERVICE_FINISHED]: '服务已完成',
  [MESSAGE_TYPE.ORDER_COMPLETED]: '订单已完成',
  [MESSAGE_TYPE.WORKER_APPROVED]: '审核通过',
  [MESSAGE_TYPE.WORKER_REJECTED]: '审核未通过',
  [MESSAGE_TYPE.SYSTEM]: '系统消息'
})

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  PAY_STATUS,
  PAY_STATUS_TEXT,
  WORKER_AUDIT_STATUS,
  WORKER_AUDIT_STATUS_TEXT,
  COMMON_STATUS,
  MESSAGE_TYPE,
  MESSAGE_TYPE_TEXT
}
