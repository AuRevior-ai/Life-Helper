Component({
  properties: {
    active: {
      type: String,
      value: "hall",
    },
  },

  data: {
    tabs: [
      {
        key: "hall",
        text: "进入接单大厅",
        icon: "briefcase",
        url: "/pages/worker/order-hall/order-hall",
      },
      {
        key: "orders",
        text: "我的订单",
        icon: "orders",
        url: "/pages/worker/order-list/order-list",
      },
      {
        key: "profile",
        text: "我的",
        icon: "profile",
        url: "/pages/worker/profile/profile",
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
