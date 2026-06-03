const qualificationService = require("../../../services/qualification.service");
const { showError, showSuccess } = require("../../../utils/toast");

Page({
  data: { merchantId: "", riskRecords: [] },
  onInput(event) {
    this.setData({ merchantId: event.detail.value });
  },
  onLoad() {
    this.loadRecords();
  },
  async loadRecords() {
    try {
      const data = await qualificationService.adminListRiskRecords();
      this.setData({ riskRecords: data.riskRecords || data.list || [] });
    } catch (error) {
      showError(error.message || "风控记录加载失败");
    }
  },
  async setRisk(event) {
    try {
      await qualificationService.adminSetRiskLevel({
        merchantId: this.data.merchantId,
        riskLevel: event.currentTarget.dataset.level,
        reason: "阶段 20 mock 风控",
      });
      showSuccess("风险等级已更新");
      await this.loadRecords();
    } catch (error) {
      showError(error.message || "设置失败");
    }
  },
});
