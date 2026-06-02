# Phase 20 Deposit Qualification Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add mock-only qualification, insurance, deposit, risk, onboarding, admin review, contract, and page support for phase 20.

**Architecture:** Add an independent `qualification` cloud function with focused service files and repositories. Keep existing merchant behavior stable, adding only a minimal onboarding operation gate to service publishing.

**Tech Stack:** WeChat Mini Program JavaScript, Node CommonJS, `wx-server-sdk`, Node built-in test runner, Markdown and JSON schema contracts.

---

### Task 1: Failing Tests

**Files:**
- Create: `tests/phase20.qualification.test.js`
- Create: `tests/phase20.deposit.test.js`
- Create: `tests/phase20.risk.test.js`
- Create: `tests/phase20.onboarding.test.js`
- Create: `tests/phase20.contracts.test.js`

- [ ] Write behavior tests that import `cloudfunctions/qualification/handler.js`.
- [ ] Run `node --test tests/phase20*.test.js`.
- [ ] Confirm the tests fail because the new cloud function, actions, contracts, and pages do not exist yet.

### Task 2: Backend Services

**Files:**
- Create: `cloudfunctions/qualification/index.js`
- Create: `cloudfunctions/qualification/handler.js`
- Create: `cloudfunctions/qualification/repositories.js`
- Create: `cloudfunctions/qualification/qualification.constants.js`
- Create: `cloudfunctions/qualification/qualification.validator.js`
- Create: `cloudfunctions/qualification/qualification.service.js`
- Create: `cloudfunctions/qualification/deposit.service.js`
- Create: `cloudfunctions/qualification/risk.service.js`
- Create: `cloudfunctions/qualification/onboarding.service.js`
- Create: `cloudfunctions/qualification/package.json`
- Modify: `cloudfunctions/merchant/handler.js`
- Modify: `cloudfunctions/merchant/index.js`
- Modify: `cloudfunctions/merchant/repositories.js`

- [ ] Implement the minimal service code to pass phase 20 behavior tests.
- [ ] Add a merchant publishing gate that blocks `BLOCKED` risk and non-active onboarding when the qualification repositories are available.
- [ ] Run phase 20 behavior tests.

### Task 3: Frontend Pages

**Files:**
- Create: `miniprogram/services/qualification.service.js`
- Create page files under the six phase 20 page directories.
- Modify: `miniprogram/app.json`
- Modify: `miniprogram/config/constants.js`
- Modify: `miniprogram/config/status.js`

- [ ] Add action service wrapper and minimal page workflows.
- [ ] Ensure all merchant-facing pages display mock warnings.
- [ ] Run phase 20 contract tests.

### Task 4: Contracts And Documentation

**Files:**
- Create: `schema/merchant-qualifications.schema.json`
- Create: `schema/merchant-deposits.schema.json`
- Create: `schema/merchant-risk-records.schema.json`
- Create: `schema/merchant-onboarding-logs.schema.json`
- Create: `docs/dev-records/20_deposit-qualification-certification.md`
- Modify: `docs/dev-records/index.md`
- Modify: `docs/contracts/status-contract.md`
- Modify: `docs/contracts/database-schema.md`
- Modify: `docs/contracts/api-actions.md`
- Modify: `docs/contracts/api-actions.manifest.json`
- Modify: `docs/contracts/permission-matrix.md`
- Modify: `docs/contracts/pagination-and-indexes.md`
- Modify: `README.md`

- [ ] Synchronize new states, collections, actions, permissions, indexes, mock boundaries, and test results.
- [ ] Run `npm test`.
- [ ] Record final test output in the phase 20 record.
