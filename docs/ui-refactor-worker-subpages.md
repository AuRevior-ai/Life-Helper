# 师傅端二级页 UI 复刻记录

日期：2026-06-04

## 阶段目标

本轮在不修改接口、不修改业务逻辑、不修改数据结构的前提下，将师傅端二级页继续向已完成的师傅端一级页视觉风格靠拢：自定义沉浸式头部、浅灰白背景、白色大圆角卡片、轻阴影、绿色主色、灰蓝辅助文字、统一安全区和横向防溢出。

## 页面清单

| 页面 | 路径 | 本轮处理 |
| ---- | ---- | -------- |
| 订单详情 | `miniprogram/pages/worker/order-detail/order-detail` | 自定义导航、统一二级页外壳、底部安全留白、横向溢出保护 |
| 我的收益 | `miniprogram/pages/worker/income/income` | 自定义导航、收益卡片安全区、列表卡片边界统一 |
| 用户评价列表 | `miniprogram/pages/worker/review-list/review-list` | 自定义导航、评价概览与列表继承统一外壳 |
| 评价详情 | `miniprogram/pages/worker/review-detail/review-detail` | 自定义导航、回复/申诉卡片安全区与按钮风格统一 |
| 师傅入驻申请 | `miniprogram/pages/worker/apply/apply` | 自定义导航、表单卡片与按钮底部留白统一 |
| 审核状态 | `miniprogram/pages/worker/audit-status/audit-status` | 自定义导航、状态卡片与资料行边界统一 |
| 服务范围 | `miniprogram/pages/provider/service-range/service-range` | 自定义导航、配置表单与边界说明卡片统一 |
| 打赏记录 | `miniprogram/pages/worker/tip-list/tip-list` | 从旧 `page-shell/panel` 结构迁移为师傅二级页卡片 |
| 消息中心 | `miniprogram/pages/message-list/message-list` | 多身份共用页，仅补自定义导航、安全区和横向防溢出 |
| 完善资料 | `miniprogram/pages/profile-edit/profile-edit` | 多身份共用页，仅补自定义导航、安全区和横向防溢出 |

## 共享样式

新增 `miniprogram/styles/worker-subpage.wxss`，提供：

- `worker-subpage`：统一页面背景、左右 padding、顶部胶囊安全区、底部安全区和 `overflow-x: hidden`。
- `worker-subpage-header`、`worker-subpage-title`、`worker-subpage-subtitle`：统一内容区大标题和副标题。
- `worker-section-card`、`worker-info-row`、`worker-pill`、`worker-primary-button`、`worker-secondary-button`、`worker-bottom-action-bar`：为后续二级页继续统一提供基础类。

## 业务逻辑变化

无

## 数据与接口变化

无

## 云函数变化

无

## mock 与真实能力边界

- 收益、财务、打赏仍为内部模拟展示，不代表真实提现、真实分账或真实到账。
- 入驻、资质、审核仍为资料留档和人工审核展示，不接入真实身份证认证、OCR、保险核验或自动风控。
- 服务范围仍为基础配置，不包含路径规划、实时轨迹、ETA、自动派单或 AI 派单。

## 适配检查

后续实机或开发者工具检查时，重点在 375px、390px、414px 三档宽度确认：

1. 顶部没有默认返回箭头和重复系统标题。
2. 页面内容不顶到微信胶囊按钮。
3. 卡片和列表左右边界统一。
4. 不出现横向滚动、右侧裁切或 `100vw + padding` 溢出。
5. 页面底部滚动到末尾时不被底部导航或系统安全区遮挡。

## 仍有差异

- 图标仍沿用当前单字占位或现有组件，未替换为完整图标素材。
- 二级页没有新增复杂插画或动效，只统一结构、间距、卡片和安全区。
- 消息中心、完善资料是多身份共用页，本轮只做低风险安全区与导航处理，未改成师傅专属信息架构。
