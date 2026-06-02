const qualificationService = require('../../../services/qualification.service')
const {
  ONBOARDING_STATUS_TEXT,
  RISK_LEVEL_TEXT
} = require('../../../config/status')
const { showError } = require('../../../utils/toast')

function buildStatusView(status = {}) {
  const onboardingStatus = status.onboarding_status || 'INCOMPLETE'
  const riskLevel = status.risk_level || 'LOW'
  const canOperate = status.can_operate === true
  return {
    onboardingStatus,
    riskLevel,
    statusText: ONBOARDING_STATUS_TEXT[onboardingStatus] || '未完成',
    riskText: RISK_LEVEL_TEXT[riskLevel] || '低风险',
    permissionText: canOperate ? '可正常经营' : '暂不可经营',
    tone: canOperate ? 'good' : 'warn',
    nextActionText: status.message || '请按顺序完成资质认证、模拟保证金和平台复核',
    summary: canOperate
      ? '入驻准入已完成，可以继续维护服务和接收订单。'
      : '还需要完成准入材料或等待平台复核。'
  }
}

Page({
  data: {
    status: {},
    statusView: buildStatusView({})
  },
  onLoad() { this.loadStatus() },
  async loadStatus() {
    try {
      const data = await qualificationService.getMyRiskStatus()
      this.setData({
        status: data,
        statusView: buildStatusView(data)
      })
    } catch (error) {
      showError(error.message || '风险状态加载失败')
    }
  }
})
