const messageService = require("../../services/message.service");
const { MESSAGE_TYPE_TEXT } = require("../../config/status");
const { USER_ROLE } = require("../../config/roles");
const { getCurrentIdentityRole } = require("../../utils/auth");
const { showError, showSuccess } = require("../../utils/toast");

function mapMessage(message = {}) {
  return {
    ...message,
    typeText: MESSAGE_TYPE_TEXT[message.type] || "消息",
    readText: message.is_read ? "已读" : "未读",
  };
}

Page({
  data: {
    title: "消息中心",
    messages: [],
    unreadCount: 0,
    page: 1,
    pageSize: 20,
    hasMore: false,
    loading: true,
  },

  onShow() {
    this.loadMessages(true);
  },

  onPullDownRefresh() {
    this.loadMessages(true).finally(() => wx.stopPullDownRefresh());
  },

  onReachBottom() {
    if (this.data.hasMore && !this.data.loading) {
      this.loadMessages(false);
    }
  },

  async loadMessages(reset = true) {
    const page = reset ? 1 : this.data.page + 1;
    this.setData({ loading: true });
    try {
      const data = await messageService.getMessageList({
        page,
        pageSize: this.data.pageSize,
        role: getCurrentIdentityRole(),
      });
      const list = (data.list || data.messages || []).map(mapMessage);
      this.setData({
        messages: reset ? list : this.data.messages.concat(list),
        unreadCount: data.unread_count || 0,
        page: data.page || page,
        hasMore: !!data.hasMore,
      });
    } catch (error) {
      showError(error.message || "消息加载失败");
    } finally {
      this.setData({ loading: false });
    }
  },

  async markMessageRead(messageId) {
    if (!messageId) return;
    await messageService.markMessageRead({ messageId });
  },

  getOrderDetailUrl(message) {
    const orderId = message.related_id || message.order_id;
    if (!orderId || message.related_type !== "order") {
      return "";
    }

    const pageMap = {
      [USER_ROLE.WORKER]: "/pages/worker/order-detail/order-detail",
      [USER_ROLE.MERCHANT]: "/pages/merchant/order-detail/order-detail",
      [USER_ROLE.USER]: "/pages/order-detail/order-detail",
    };
    const page = pageMap[message.role] || "/pages/order-detail/order-detail";
    return `${page}?orderId=${orderId}`;
  },

  getMerchantDetailUrl(message) {
    const merchantId = message.related_id || message.merchant_id;
    if (message.related_type !== "merchant") {
      return "";
    }

    const query = merchantId ? `?merchantId=${merchantId}` : "";
    return `/pages/merchant/audit-status/audit-status${query}`;
  },

  getMessageDetailUrl(message) {
    return this.getOrderDetailUrl(message) || this.getMerchantDetailUrl(message);
  },

  async handleMessageTap(event) {
    const messageId = event.currentTarget.dataset.id;
    const index = event.currentTarget.dataset.index;
    const message = this.data.messages[index] || {};
    try {
      await this.markMessageRead(messageId);
      const url = this.getMessageDetailUrl(message);
      if (url) {
        wx.navigateTo({ url });
        return;
      }

      this.loadMessages(true);
    } catch (error) {
      showError(error.message || "标记失败");
    }
  },

  async markRead(event) {
    return this.handleMessageTap(event);
  },

  async markAllRead() {
    try {
      await messageService.markAllMessagesRead({
        role: getCurrentIdentityRole(),
      });
      showSuccess("已全部标记为已读");
      this.loadMessages(true);
    } catch (error) {
      showError(error.message || "标记失败");
    }
  },
});
