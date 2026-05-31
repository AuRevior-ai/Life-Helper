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

const AFTER_SALE_STATUS = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
  CANCELED: 'canceled',
  REFUNDED: 'refunded'
})

const AFTER_SALE_STATUS_TEXT = Object.freeze({
  [AFTER_SALE_STATUS.NONE]: '无售后',
  [AFTER_SALE_STATUS.PENDING]: '售后待审核',
  [AFTER_SALE_STATUS.APPROVED]: '售后已通过',
  [AFTER_SALE_STATUS.REJECTED]: '售后未通过',
  [AFTER_SALE_STATUS.CANCELED]: '售后已取消',
  [AFTER_SALE_STATUS.REFUNDED]: '已退款'
})

const AFTER_SALE_TYPE = Object.freeze({
  REFUND_ONLY: 'refund_only',
  CANCEL_AND_REFUND: 'cancel_and_refund'
})

const AFTER_SALE_TYPE_TEXT = Object.freeze({
  [AFTER_SALE_TYPE.REFUND_ONLY]: '仅退款',
  [AFTER_SALE_TYPE.CANCEL_AND_REFUND]: '取消并退款'
})

const REFUND_STATUS = Object.freeze({
  NONE: 'none',
  PENDING: 'pending',
  SUCCESS: 'success',
  FAILED: 'failed',
  MOCK_SUCCESS: 'mock_success'
})

const REFUND_STATUS_TEXT = Object.freeze({
  [REFUND_STATUS.NONE]: '未退款',
  [REFUND_STATUS.PENDING]: '退款处理中',
  [REFUND_STATUS.SUCCESS]: '退款成功',
  [REFUND_STATUS.FAILED]: '退款失败',
  [REFUND_STATUS.MOCK_SUCCESS]: '模拟退款成功'
})

const REFUND_CHANNEL = Object.freeze({
  MOCK: 'mock',
  WECHAT: 'wechat'
})

const SERVICE_AREA_STATUS = Object.freeze({
  ENABLED: 'enabled',
  DISABLED: 'disabled'
})

const SERVICE_AREA_STATUS_TEXT = Object.freeze({
  [SERVICE_AREA_STATUS.ENABLED]: '启用',
  [SERVICE_AREA_STATUS.DISABLED]: '禁用'
})

const WORKER_ONLINE_STATUS = Object.freeze({
  AVAILABLE: 'available',
  PAUSED: 'paused',
  BUSY: 'busy'
})

const WORKER_ONLINE_STATUS_TEXT = Object.freeze({
  [WORKER_ONLINE_STATUS.AVAILABLE]: '可接单',
  [WORKER_ONLINE_STATUS.PAUSED]: '暂停接单',
  [WORKER_ONLINE_STATUS.BUSY]: '忙碌中'
})

const DISPATCH_ACTION = Object.freeze({
  WORKER_ACCEPT: 'worker_accept',
  ADMIN_ASSIGN: 'admin_assign',
  ADMIN_UNASSIGN: 'admin_unassign',
  ORDER_REFLOW: 'order_reflow'
})

const DISPATCH_ACTION_TEXT = Object.freeze({
  [DISPATCH_ACTION.WORKER_ACCEPT]: '师傅接单',
  [DISPATCH_ACTION.ADMIN_ASSIGN]: '管理员指派',
  [DISPATCH_ACTION.ADMIN_UNASSIGN]: '取消指派',
  [DISPATCH_ACTION.ORDER_REFLOW]: '订单回流'
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
  AFTER_SALE_CREATED: 'after_sale_created',
  AFTER_SALE_APPROVED: 'after_sale_approved',
  AFTER_SALE_REJECTED: 'after_sale_rejected',
  REFUND_SUCCESS: 'refund_success',
  REFUND_FAILED: 'refund_failed',
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
  [MESSAGE_TYPE.AFTER_SALE_CREATED]: '售后已提交',
  [MESSAGE_TYPE.AFTER_SALE_APPROVED]: '售后已通过',
  [MESSAGE_TYPE.AFTER_SALE_REJECTED]: '售后未通过',
  [MESSAGE_TYPE.REFUND_SUCCESS]: '退款成功',
  [MESSAGE_TYPE.REFUND_FAILED]: '退款失败',
  [MESSAGE_TYPE.WORKER_APPROVED]: '审核通过',
  [MESSAGE_TYPE.WORKER_REJECTED]: '审核未通过',
  [MESSAGE_TYPE.SYSTEM]: '系统消息'
})

module.exports = {
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  PAY_STATUS,
  PAY_STATUS_TEXT,
  AFTER_SALE_STATUS,
  AFTER_SALE_STATUS_TEXT,
  AFTER_SALE_TYPE,
  AFTER_SALE_TYPE_TEXT,
  REFUND_STATUS,
  REFUND_STATUS_TEXT,
  REFUND_CHANNEL,
  SERVICE_AREA_STATUS,
  SERVICE_AREA_STATUS_TEXT,
  WORKER_ONLINE_STATUS,
  WORKER_ONLINE_STATUS_TEXT,
  DISPATCH_ACTION,
  DISPATCH_ACTION_TEXT,
  WORKER_AUDIT_STATUS,
  WORKER_AUDIT_STATUS_TEXT,
  COMMON_STATUS,
  MESSAGE_TYPE,
  MESSAGE_TYPE_TEXT
}
