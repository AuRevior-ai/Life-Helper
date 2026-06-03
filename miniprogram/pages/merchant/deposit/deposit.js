const qualificationService = require("../../../services/qualification.service");
const {
  DEPOSIT_STATUS,
  DEPOSIT_STATUS_TEXT,
} = require("../../../config/status");
const { formatPrice } = require("../../../utils/format");
const { showError, showSuccess } = require("../../../utils/toast");

function buildDepositView(deposit = {}) {
  const status = deposit.deposit_status || DEPOSIT_STATUS.UNPAID;
  const requiredAmount = Number(deposit.required_amount || 50000);
  const paidAmount = Number(deposit.paid_amount || 0);
  const canMockPay = [
    DEPOSIT_STATUS.UNPAID,
    DEPOSIT_STATUS.MOCK_PAYING,
  ].includes(status);
  const canApplyRefund = [
    DEPOSIT_STATUS.MOCK_PAID,
    DEPOSIT_STATUS.FROZEN,
    DEPOSIT_STATUS.REFUND_REJECTED,
  ].includes(status);
  return {
    status,
    statusText: DEPOSIT_STATUS_TEXT[status] || "未缴纳",
    requiredAmountText: formatPrice(requiredAmount),
    paidAmountText: formatPrice(paidAmount),
    canMockPay,
    canApplyRefund,
    isPassed: status === DEPOSIT_STATUS.MOCK_PAID,
    helperText:
      status === DEPOSIT_STATUS.MOCK_PAID
        ? "已模拟缴纳，保证金流程已通过。"
        : "状态变为 MOCK_PAID（已模拟缴纳）才算完成保证金流程。冻结是管理员风控动作，不是正常缴费步骤。",
  };
}

Page({
  data: {
    deposit: {},
    depositView: buildDepositView({}),
    canMockPay: true,
    canApplyRefund: false,
  },
  onLoad() {
    this.loadDeposit();
  },
  async loadDeposit() {
    try {
      const data = await qualificationService.getMyDeposit();
      const deposit = data.deposit || {};
      const depositView = buildDepositView(deposit);
      this.setData({
        deposit,
        depositView,
        canMockPay: depositView.canMockPay,
        canApplyRefund: depositView.canApplyRefund,
      });
    } catch (error) {
      showError(error.message || "保证金加载失败");
    }
  },
  async mockPay() {
    try {
      await qualificationService.mockPayDeposit();
      showSuccess("模拟保证金已缴纳");
      setTimeout(() => {
        wx.navigateBack();
      }, 600);
    } catch (error) {
      showError(error.message || "模拟缴纳失败");
    }
  },
  async applyRefund() {
    try {
      await qualificationService.applyDepositRefund({
        reason: "商家申请模拟退还",
      });
      showSuccess("退还申请已提交");
      await this.loadDeposit();
    } catch (error) {
      showError(error.message || "申请失败");
    }
  },
});
