Component({
  properties: {
    active: {
      type: String,
      value: "dashboard",
    },
  },

  data: {
    tabs: [
      {
        key: "dashboard",
        text: "工作台",
        icon: "home",
        url: "/pages/admin/dashboard/dashboard",
      },
      {
        key: "order",
        text: "订单",
        icon: "order",
        url: "/pages/admin/order-list/order-list",
      },
      {
        key: "review",
        text: "审核",
        icon: "review",
        url: "/pages/admin/review-center/review-center",
      },
      {
        key: "operation",
        text: "运营",
        icon: "operation",
        url: "/pages/admin/operation-center/operation-center",
      },
      {
        key: "profile",
        text: "我的",
        icon: "profile",
        url: "/pages/admin/profile/profile",
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
