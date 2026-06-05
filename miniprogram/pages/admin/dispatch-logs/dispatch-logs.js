const dispatchService = require("../../../services/dispatch.service");
const { showError } = require("../../../utils/toast");

function mapLog(log) {
  return {
    ...log,
    orderText: log.order_no || log.order_id || "未关联订单号",
    statusText: `${log.from_status || "未记录"} → ${log.to_status || "未记录"}`,
    reasonText: log.reason || "未填写原因",
    actionText: log.action || "派单记录",
  };
}

Page({
  data: {
    title: "派单日志",
    orderId: "",
    logs: [],
    collectionMissing: false,
    loading: true,
    errorText: "",
    filterPills: ["派单记录", "人工操作", "非实时轨迹", "非 ETA"],
  },

  onLoad(options = {}) {
    this.setData({ orderId: options.orderId || "" });
    this.loadLogs();
  },

  async loadLogs() {
    this.setData({ loading: true, errorText: "" });
    try {
      const data = await dispatchService.getDispatchLogs({
        orderId: this.data.orderId,
      });
      this.setData({
        logs: (data.logs || []).map(mapLog),
        collectionMissing: data.collection_missing === true,
      });
    } catch (error) {
      const errorText = error.message || "派单日志加载失败";
      this.setData({ errorText });
      showError(errorText);
    } finally {
      this.setData({ loading: false });
    }
  },
});
