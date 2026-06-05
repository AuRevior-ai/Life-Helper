const qualificationService = require("../../../services/qualification.service");
const { showError, showSuccess } = require("../../../utils/toast");

function isCollectionMissing(error = {}) {
  return /DATABASE_COLLECTION_NOT_EXIST|collection not exists|Db or Table not exist|merchant_qualifications/.test(
    error.message || "",
  );
}

function mapQualification(item = {}) {
  return {
    ...item,
    titleText: item.business_name || item.real_name_mock || item.merchant_id || "未命名资质",
    statusText: item.qualification_status || item.status || "待资料留档",
    merchantText: item.merchant_id || "未关联商家",
    rejectText: item.reject_reason || item.review_reason || "暂无审核说明",
  };
}

Page({
  data: {
    title: "资质审核",
    qualifications: [],
    collectionMissing: false,
    loading: true,
    errorText: "",
    submitting: "",
    filterPills: ["全部资料", "资料留档", "人工审核"],
  },
  onLoad() {
    this.loadList();
  },
  async loadList() {
    this.setData({ loading: true, collectionMissing: false, errorText: "" });
    try {
      const data = await qualificationService.adminListQualifications();
      this.setData({
        qualifications: (data.qualifications || data.list || []).map(mapQualification),
        collectionMissing: data.collection_missing === true,
      });
    } catch (error) {
      if (isCollectionMissing(error)) {
        this.setData({ qualifications: [], collectionMissing: true });
        return;
      }
      const errorText = error.message || "资质列表加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },
  async review(event) {
    const { id, result } = event.currentTarget.dataset;
    this.setData({ submitting: `${id}:${result}` });
    try {
      await qualificationService.adminReviewQualification({
        qualificationId: id,
        reviewResult: result,
        reason: "阶段 20 mock 审核",
      });
      showSuccess("审核已处理");
      await this.loadList();
    } catch (error) {
      showError(error.message || "审核失败");
    } finally {
      this.setData({ submitting: "" });
    }
  },
});
