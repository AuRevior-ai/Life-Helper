# Wechat Pay Lite Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add configurable lightweight WeChat Pay preparation while preserving mock payment.

**Architecture:** Payment logic lives in a new `payment` cloud function. Existing `order` keeps order lifecycle and mock payment. The mini program switches payment mode through a single config file and confirms results through backend state.

**Tech Stack:** WeChat Mini Program, WeChat Cloud Functions, Node.js built-in test runner.

---

### Task 1: Payment Tests

**Files:**
- Create: `tests/phase13.wechat-pay-lite.test.js`

- [x] Write failing tests for payment docs, payment cloud function, callback idempotency, frontend wiring, and secret scanning.
- [x] Run `npm test` and confirm failures are caused by missing stage 13 implementation.

### Task 2: Payment Cloud Function

**Files:**
- Create: `cloudfunctions/payment/index.js`
- Create: `cloudfunctions/payment/handler.js`
- Create: `cloudfunctions/payment/order-repository.js`
- Create: `cloudfunctions/payment/payment-repository.js`
- Create: `cloudfunctions/payment/message-repository.js`
- Create: `cloudfunctions/payment/wechat-pay-client.js`
- Create: `cloudfunctions/payment/package.json`
- Create: `cloudfunctions/payment/config.example.js`

- [x] Implement `createPayment`, `handlePayNotify`, and `queryPaymentStatus`.
- [x] Keep real payment disabled by default with `PAY_MODE=mock`.
- [x] Make callback processing idempotent and create payment logs.

### Task 3: Mini Program Payment Flow

**Files:**
- Create: `miniprogram/config/payment.js`
- Create: `miniprogram/services/payment.service.js`
- Create: `miniprogram/pages/pay-result/pay-result.*`
- Modify: `miniprogram/pages/order-detail/order-detail.js`
- Modify: `miniprogram/pages/order-detail/order-detail.wxml`
- Modify: `miniprogram/app.json`

- [x] Add central payment mode config.
- [x] Preserve mock payment as default.
- [x] Add WeChat Pay request path and pay result page.

### Task 4: Docs And Verification

**Files:**
- Create: `docs/wechat-pay-setup.md`
- Create: `docs/wechat-pay-config.example.md`
- Create: `docs/dev-records/13_wechat-pay-lite.md`
- Modify: `README.md`
- Modify: `docs/wechat-mvp-verification.md`
- Modify: `docs/dev-records/index.md`

- [x] Document manual merchant setup and forbidden secret files.
- [x] Record stage 13 results and known limitations.
- [x] Run `npm test` and commit only relevant files.
