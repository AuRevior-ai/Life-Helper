const {
  ORDER_STATUS,
  ORDER_STATUS_TEXT,
  PAY_STATUS,
  PAY_STATUS_TEXT,
  AFTER_SALE_STATUS,
  AFTER_SALE_STATUS_TEXT,
  REFUND_STATUS,
  REFUND_STATUS_TEXT,
  WORKER_EARNING_STATUS,
  WORKER_EARNING_STATUS_TEXT,
  SETTLEMENT_STATUS,
  SETTLEMENT_STATUS_TEXT,
  MEMBER_STATUS,
  MEMBER_STATUS_TEXT,
  COUPON_STATUS,
  COUPON_STATUS_TEXT,
  USER_COUPON_STATUS,
  USER_COUPON_STATUS_TEXT,
  MERCHANT_AUDIT_STATUS,
  MERCHANT_AUDIT_STATUS_TEXT,
  MERCHANT_STATUS,
  MERCHANT_STATUS_TEXT,
  QUALIFICATION_STATUS,
  QUALIFICATION_STATUS_TEXT,
  DEPOSIT_STATUS,
  DEPOSIT_STATUS_TEXT,
  RISK_LEVEL,
  RISK_LEVEL_TEXT,
  ONBOARDING_STATUS,
  ONBOARDING_STATUS_TEXT,
  LBS_MATCH_RESULT
} = require('../config/status')

const DEFAULT_VIEW = Object.freeze({
  text: '未知状态',
  tone: 'default'
})

const LBS_MATCH_RESULT_TEXT = Object.freeze({
  [LBS_MATCH_RESULT.MATCHED_BY_RADIUS]: '半径命中',
  [LBS_MATCH_RESULT.MATCHED_BY_ADMIN_AREA]: '行政区命中',
  [LBS_MATCH_RESULT.NOT_MATCHED]: '未命中',
  [LBS_MATCH_RESULT.LOCATION_MISSING]: '缺少位置',
  [LBS_MATCH_RESULT.LEGACY_COMPAT]: '历史小区兼容'
})

const TYPE_CONFIG = Object.freeze({
  order: {
    textMap: ORDER_STATUS_TEXT,
    tones: {
      [ORDER_STATUS.PENDING_PAY]: 'warning',
      [ORDER_STATUS.PENDING_ACCEPT]: 'warning',
      [ORDER_STATUS.ACCEPTED]: 'success',
      [ORDER_STATUS.SERVING]: 'success',
      [ORDER_STATUS.PENDING_REVIEW]: 'warning',
      [ORDER_STATUS.COMPLETED]: 'success',
      [ORDER_STATUS.CANCELED]: 'default'
    }
  },
  pay: {
    textMap: PAY_STATUS_TEXT,
    tones: {
      [PAY_STATUS.UNPAID]: 'warning',
      [PAY_STATUS.PAYING]: 'warning',
      [PAY_STATUS.PAID]: 'success',
      [PAY_STATUS.FAILED]: 'danger',
      [PAY_STATUS.REFUNDED]: 'default'
    }
  },
  afterSale: {
    textMap: AFTER_SALE_STATUS_TEXT,
    tones: {
      [AFTER_SALE_STATUS.NONE]: 'default',
      [AFTER_SALE_STATUS.PENDING]: 'warning',
      [AFTER_SALE_STATUS.APPROVED]: 'success',
      [AFTER_SALE_STATUS.REJECTED]: 'danger',
      [AFTER_SALE_STATUS.CANCELED]: 'default',
      [AFTER_SALE_STATUS.REFUNDED]: 'success'
    }
  },
  refund: {
    textMap: REFUND_STATUS_TEXT,
    tones: {
      [REFUND_STATUS.NONE]: 'default',
      [REFUND_STATUS.PENDING]: 'warning',
      [REFUND_STATUS.SUCCESS]: 'success',
      [REFUND_STATUS.FAILED]: 'danger',
      [REFUND_STATUS.MOCK_SUCCESS]: 'success'
    }
  },
  finance: {
    textMap: WORKER_EARNING_STATUS_TEXT,
    tones: {
      [WORKER_EARNING_STATUS.FROZEN]: 'warning',
      [WORKER_EARNING_STATUS.SETTLEABLE]: 'success',
      [WORKER_EARNING_STATUS.SETTLED]: 'success',
      [WORKER_EARNING_STATUS.REVERSED]: 'danger',
      [WORKER_EARNING_STATUS.PENDING_MANUAL]: 'warning'
    }
  },
  settlement: {
    textMap: SETTLEMENT_STATUS_TEXT,
    tones: {
      [SETTLEMENT_STATUS.NOT_SETTLED]: 'warning',
      [SETTLEMENT_STATUS.SETTLEABLE]: 'success',
      [SETTLEMENT_STATUS.SETTLED]: 'success',
      [SETTLEMENT_STATUS.REVERSED]: 'danger'
    }
  },
  member: {
    textMap: MEMBER_STATUS_TEXT,
    tones: {
      [MEMBER_STATUS.INACTIVE]: 'default',
      [MEMBER_STATUS.ACTIVE]: 'success',
      [MEMBER_STATUS.EXPIRED]: 'warning',
      [MEMBER_STATUS.DISABLED]: 'danger'
    }
  },
  coupon: {
    textMap: USER_COUPON_STATUS_TEXT,
    tones: {
      [USER_COUPON_STATUS.UNUSED]: 'success',
      [USER_COUPON_STATUS.USED]: 'default',
      [USER_COUPON_STATUS.EXPIRED]: 'warning',
      [USER_COUPON_STATUS.LOCKED]: 'warning'
    }
  },
  couponTemplate: {
    textMap: COUPON_STATUS_TEXT,
    tones: {
      [COUPON_STATUS.DRAFT]: 'default',
      [COUPON_STATUS.ACTIVE]: 'success',
      [COUPON_STATUS.DISABLED]: 'danger',
      [COUPON_STATUS.EXPIRED]: 'warning'
    }
  },
  merchantAudit: {
    textMap: MERCHANT_AUDIT_STATUS_TEXT,
    tones: {
      [MERCHANT_AUDIT_STATUS.PENDING]: 'warning',
      [MERCHANT_AUDIT_STATUS.APPROVED]: 'success',
      [MERCHANT_AUDIT_STATUS.REJECTED]: 'danger'
    }
  },
  merchant: {
    textMap: MERCHANT_STATUS_TEXT,
    tones: {
      [MERCHANT_STATUS.NORMAL]: 'success',
      [MERCHANT_STATUS.DISABLED]: 'danger'
    }
  },
  qualification: {
    textMap: QUALIFICATION_STATUS_TEXT,
    tones: {
      [QUALIFICATION_STATUS.NOT_SUBMITTED]: 'default',
      [QUALIFICATION_STATUS.DRAFT]: 'default',
      [QUALIFICATION_STATUS.PENDING_REVIEW]: 'warning',
      [QUALIFICATION_STATUS.APPROVED]: 'success',
      [QUALIFICATION_STATUS.REJECTED]: 'danger',
      [QUALIFICATION_STATUS.NEED_SUPPLEMENT]: 'warning',
      [QUALIFICATION_STATUS.EXPIRED]: 'danger'
    }
  },
  deposit: {
    textMap: DEPOSIT_STATUS_TEXT,
    tones: {
      [DEPOSIT_STATUS.NOT_REQUIRED]: 'default',
      [DEPOSIT_STATUS.UNPAID]: 'warning',
      [DEPOSIT_STATUS.MOCK_PAYING]: 'warning',
      [DEPOSIT_STATUS.MOCK_PAID]: 'success',
      [DEPOSIT_STATUS.FROZEN]: 'warning',
      [DEPOSIT_STATUS.REFUND_PENDING]: 'warning',
      [DEPOSIT_STATUS.MOCK_REFUNDED]: 'default',
      [DEPOSIT_STATUS.REFUND_REJECTED]: 'danger'
    }
  },
  risk: {
    textMap: RISK_LEVEL_TEXT,
    tones: {
      [RISK_LEVEL.LOW]: 'success',
      [RISK_LEVEL.MEDIUM]: 'warning',
      [RISK_LEVEL.HIGH]: 'danger',
      [RISK_LEVEL.BLOCKED]: 'danger'
    }
  },
  onboarding: {
    textMap: ONBOARDING_STATUS_TEXT,
    tones: {
      [ONBOARDING_STATUS.INCOMPLETE]: 'default',
      [ONBOARDING_STATUS.QUALIFICATION_WAIT]: 'warning',
      [ONBOARDING_STATUS.DEPOSIT_WAIT]: 'warning',
      [ONBOARDING_STATUS.RISK_REVIEW]: 'warning',
      [ONBOARDING_STATUS.ACTIVE]: 'success',
      [ONBOARDING_STATUS.LIMITED]: 'warning',
      [ONBOARDING_STATUS.BLOCKED]: 'danger'
    }
  },
  lbsMatch: {
    textMap: LBS_MATCH_RESULT_TEXT,
    tones: {
      [LBS_MATCH_RESULT.MATCHED_BY_RADIUS]: 'success',
      [LBS_MATCH_RESULT.MATCHED_BY_ADMIN_AREA]: 'success',
      [LBS_MATCH_RESULT.NOT_MATCHED]: 'danger',
      [LBS_MATCH_RESULT.LOCATION_MISSING]: 'warning',
      [LBS_MATCH_RESULT.LEGACY_COMPAT]: 'warning'
    }
  }
})

function getStatusView(type, status) {
  const config = TYPE_CONFIG[type]
  if (!config || !config.textMap[status]) {
    return Object.assign({}, DEFAULT_VIEW)
  }

  return {
    text: config.textMap[status],
    tone: config.tones[status] || 'default'
  }
}

module.exports = {
  getStatusView,
  TYPE_CONFIG
}
