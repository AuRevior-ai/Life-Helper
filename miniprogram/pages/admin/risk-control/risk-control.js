const qualificationService = require("../../../services/qualification.service");
const { showError, showSuccess } = require("../../../utils/toast");

function mapRiskRecord(record = {}) {
  return {
    ...record,
    merchantText: record.merchant_id || "未关联商家",
    riskText: record.risk_level || "未设置等级",
    reasonText: record.risk_reason || record.reason || "未填写原因",
  };
}

Page({
  data: {
    title: "入驻风控",
    merchantId: "",
    riskRecords: [],
    loading: true,
    errorText: "",
    submitting: "",
    filterPills: ["全部记录", "内部模拟风控", "非自动风控"],
  },
  onInput(event) {
    this.setData({ merchantId: event.detail.value });
  },
  onLoad() {
    this.loadRecords();
  },
  async loadRecords() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await qualificationService.adminListRiskRecords();
      this.setData({
        riskRecords: (data.riskRecords || data.list || []).map(mapRiskRecord),
      });
    } catch (error) {
      const errorText = error.message || "风控记录加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },
  async setRisk(event) {
    const riskLevel = event.currentTarget.dataset.level;
    this.setData({ submitting: riskLevel });
    try {
      await qualificationService.adminSetRiskLevel({
        merchantId: this.data.merchantId,
        riskLevel,
        reason: "阶段 20 mock 风控",
      });
      showSuccess("风险等级已更新");
      await this.loadRecords();
    } catch (error) {
      showError(error.message || "设置失败");
    } finally {
      this.setData({ submitting: "" });
    }
  },
});
