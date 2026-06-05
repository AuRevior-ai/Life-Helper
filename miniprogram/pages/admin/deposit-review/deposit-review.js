const qualificationService = require("../../../services/qualification.service");
const { showError, showSuccess } = require("../../../utils/toast");

function isCollectionMissing(error = {}) {
  return /DATABASE_COLLECTION_NOT_EXIST|collection not exists|Db or Table not exist|merchant_deposits/.test(
    error.message || "",
  );
}

function mapDeposit(item = {}) {
  return {
    ...item,
    merchantText: item.merchant_id || "未关联商家",
    statusText: item.deposit_status || item.status || "未记录状态",
    amountText: `${Number(item.required_amount || item.amount || 0)} 分`,
    refundText: item.refund_status || "无退还申请",
  };
}

Page({
  data: {
    title: "保证金审核",
    deposits: [],
    collectionMissing: false,
    loading: true,
    errorText: "",
    submitting: "",
    filterPills: ["全部保证金", "mock 保证金", "人工处理"],
  },
  onLoad() {
    this.loadList();
  },
  async loadList() {
    this.setData({ loading: true, collectionMissing: false, errorText: "" });
    try {
      const data = await qualificationService.adminListDeposits();
      this.setData({
        deposits: (data.deposits || data.list || []).map(mapDeposit),
        collectionMissing: data.collection_missing === true,
      });
    } catch (error) {
      if (isCollectionMissing(error)) {
        this.setData({ deposits: [], collectionMissing: true });
        return;
      }
      const errorText = error.message || "保证金列表加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },
  async freeze(event) {
    const depositId = event.currentTarget.dataset.id;
    this.setData({ submitting: `${depositId}:freeze` });
    try {
      await qualificationService.adminFreezeDeposit({
        depositId,
        reason: "阶段 20 mock 风险复核",
      });
      showSuccess("保证金已冻结");
      await this.loadList();
    } catch (error) {
      showError(error.message || "冻结失败");
    } finally {
      this.setData({ submitting: "" });
    }
  },
  async reviewRefund(event) {
    const { id, result } = event.currentTarget.dataset;
    this.setData({ submitting: `${id}:${result}` });
    try {
      await qualificationService.adminReviewDepositRefund({
        depositId: id,
        reviewResult: result,
        reason: "阶段 20 mock 退还审核",
      });
      showSuccess("退还审核已处理");
      await this.loadList();
    } catch (error) {
      showError(error.message || "审核失败");
    } finally {
      this.setData({ submitting: "" });
    }
  },
});
