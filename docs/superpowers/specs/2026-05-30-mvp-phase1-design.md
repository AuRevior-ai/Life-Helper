# 同城社区便民服务平台 MVP 第一阶段设计

## 目标

第一阶段只完成架构与初始化，不实现完整业务闭环。交付结果应能被微信开发者工具打开，并具备后续开发用户端、师傅端、管理员端的清晰目录边界。

## 架构

项目采用微信原生小程序和微信云开发。前端页面只负责展示、表单交互和跳转；`miniprogram/services` 统一封装云函数调用；`cloudfunctions` 承载后续核心业务逻辑、权限校验和订单状态流转；云数据库集合按用户、服务、地址、师傅、订单、评价拆分。

## 第一阶段范围

第一阶段创建小程序基础工程、云函数目录、配置常量、工具函数、服务调用层、基础组件和页面骨架。页面骨架不直接访问数据库，也不实现下单、接单、评价等业务逻辑。

## 目录边界

`miniprogram/config` 存放状态、角色、业务常量。`miniprogram/utils` 存放请求、登录、校验、格式化、时间、提示等通用能力。`miniprogram/services` 只做前端到云函数的调用封装。`miniprogram/components` 存放可复用 UI。`miniprogram/pages` 按用户端、师傅端、管理员端拆分。`cloudfunctions` 按领域拆分为 `login`、`user`、`service`、`address`、`order`、`worker`、`review`、`admin`。

## 数据模型

MVP 初版使用 `users`、`service_categories`、`services`、`addresses`、`workers`、`orders`、`reviews` 七个集合。金额统一使用整数分存储，前端格式化为元展示。订单状态、支付状态、用户角色和师傅审核状态统一使用英文枚举。

## 状态机

订单主流程为 `pending_pay -> pending_accept -> accepted -> serving -> pending_review -> completed`。取消仅允许 `pending_pay` 和 `pending_accept` 流转为 `canceled`。第一阶段只创建枚举和服务方法名，具体状态校验在后续订单云函数阶段实现。

## 权限

普通用户、师傅、管理员三个角色使用 `user`、`worker`、`admin` 枚举。前端页面入口会按角色展示，但最终权限校验必须在云函数中完成。第一阶段只建立角色常量和页面边界。

## 验收

阶段一完成后，`npm test` 应通过，测试内容包括：小程序路由存在、每个页面具备 `.js/.json/.wxml/.wxss` 文件、核心枚举稳定、格式化工具可用、云函数目录完整。
