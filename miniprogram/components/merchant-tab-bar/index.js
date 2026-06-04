Component({
  properties: {
    active: {
      type: String,
      value: "profile",
    },
  },

  data: {
    tabs: [
      {
        key: "profile",
        text: "我的",
        icon: "profile",
        url: "/pages/merchant/profile/profile",
      },
      {
        key: "orders",
        text: "订单",
        icon: "order",
        url: "/pages/merchant/order-list/order-list",
      },
      {
        key: "services",
        text: "服务",
        icon: "service",
        url: "/pages/merchant/service-list/service-list",
      },
      {
        key: "income",
        text: "收益",
        icon: "income",
        url: "/pages/merchant/income/income",
      },
      {
        key: "status",
        text: "入驻",
        icon: "status",
        url: "/pages/merchant/audit-status/audit-status",
      },
    ],
  },

  methods: {
    onTabTap(event) {
      const key = event.currentTarget.dataset.key;
      const target = this.data.tabs.find((tab) => tab.key === key);
      if (!target || target.key === this.data.active) {
        return;
      }

      wx.redirectTo({
        url: target.url,
      });
    },
  },
});
