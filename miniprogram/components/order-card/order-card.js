const { formatPrice, formatOrderStatus } = require("../../utils/format");

const STATUS_TONES = {
  pending_pay: "order-pending",
  pending_accept: "order-pending",
  accepted: "order-accepted",
  serving: "order-serving",
  pending_review: "order-review",
  completed: "order-completed",
  canceled: "order-canceled",
};

const ACTIONS_BY_STATUS = {
  pending_pay: [
    { type: "cancel", label: "取消订单", style: "secondary" },
    { type: "pay", label: "模拟支付", style: "primary" },
  ],
  pending_accept: [{ type: "cancel", label: "取消订单", style: "secondary" }],
  accepted: [{ type: "detail", label: "联系师傅", style: "primary" }],
  serving: [{ type: "detail", label: "联系师傅", style: "primary" }],
  pending_review: [{ type: "review", label: "去评价", style: "primary" }],
  completed: [{ type: "detail", label: "查看详情", style: "secondary" }],
};

function pickDisplayAddress(order = {}) {
  return order.full_address || order.address || order.community || "地址待完善";
}

function pickDisplayPrice(order = {}) {
  return order.pay_amount || order.payable_amount || order.price || 0;
}

Component({
  properties: {
    order: {
      type: Object,
      value: {},
    },
    variant: {
      type: String,
      value: "default",
    },
  },

  data: {
    priceText: "¥0.00",
    statusText: "未知状态",
    statusTone: "default",
    displayAddress: "地址待完善",
    displayPriceText: "¥0.00",
    actionButtons: [],
  },

  observers: {
    "order, order.price, order.pay_amount, order.payable_amount, order.status, order.full_address, order.address, order.community":
      function updateDisplayText(
        order,
        price,
        payAmount,
        payableAmount,
        status,
      ) {
        const currentOrder = order || this.properties.order || {};
        const displayPriceText = formatPrice(pickDisplayPrice(currentOrder));
        this.setData({
          priceText: formatPrice(price),
          statusText: formatOrderStatus(status),
          statusTone: STATUS_TONES[status] || "default",
          displayAddress: pickDisplayAddress(currentOrder),
          displayPriceText,
          actionButtons: ACTIONS_BY_STATUS[status] || [],
        });
      },
  },

  methods: {
    onTap() {
      this.triggerEvent("select", this.properties.order);
    },

    onActionTap(event) {
      const action = event.currentTarget.dataset.action;
      this.triggerEvent("action", {
        action,
        order: this.properties.order,
      });
    },
  },
});
