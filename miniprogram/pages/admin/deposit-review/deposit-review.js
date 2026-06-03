const qualificationService = require("../../../services/qualification.service");
const { showError, showSuccess } = require("../../../utils/toast");

function isCollectionMissing(error = {}) {
  return /DATABASE_COLLECTION_NOT_EXIST|collection not exists|Db or Table not exist|merchant_deposits/.test(
    error.message || "",
  );
}

Page({
  data: {
    deposits: [],
    collectionMissing: false,
    loading: true,
  },
  onLoad() {
    this.loadList();
  },
  async loadList() {
    this.setData({ loading: true, collectionMissing: false });
    try {
      const data = await qualificationService.adminListDeposits();
      this.setData({
        deposits: data.deposits || data.list || [],
        collectionMissing: data.collection_missing === true,
      });
    } catch (error) {
      if (isCollectionMissing(error)) {
        this.setData({ deposits: [], collectionMissing: true });
        return;
      }
      showError(error.message || "保证金列表加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },
  async freeze(event) {
    try {
      await qualificationService.adminFreezeDeposit({
        depositId: event.currentTarget.dataset.id,
        reason: "阶段 20 mock 风险复核",
      });
      showSuccess("保证金已冻结");
      await this.loadList();
    } catch (error) {
      showError(error.message || "冻结失败");
    }
  },
  async reviewRefund(event) {
    try {
      await qualificationService.adminReviewDepositRefund({
        depositId: event.currentTarget.dataset.id,
        reviewResult: event.currentTarget.dataset.result,
        reason: "阶段 20 mock 退还审核",
      });
      showSuccess("退还审核已处理");
      await this.loadList();
    } catch (error) {
      showError(error.message || "审核失败");
    }
  },
});
