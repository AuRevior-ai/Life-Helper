# Phase 2 Login And User Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement the MVP login and user-role foundation for the WeChat Mini Program.

**Architecture:** Keep pages thin. Cloud functions own openid lookup, user creation, role updates, disabled-user checks, and unified response shapes. Frontend services call cloud functions, while the profile page only triggers login and displays cached/current user state.

**Tech Stack:** WeChat Mini Program, JavaScript CommonJS, WeChat Cloud Functions, Cloud Database, Node.js built-in test runner.

---

### Task 1: Add Login And User Cloud Function Tests

**Files:**
- Create: `tests/phase2.login-user.test.js`

- [x] Write failing tests for first login, repeated login, current user lookup, profile update, admin role update, permission denial, and user disabling.
- [x] Run `npm test` and verify the new tests fail because `cloudfunctions/login/handler.js` and `cloudfunctions/user/handler.js` do not exist.

### Task 2: Implement Login And User Cloud Function Logic

**Files:**
- Create: `cloudfunctions/login/handler.js`
- Create: `cloudfunctions/login/user-repository.js`
- Modify: `cloudfunctions/login/index.js`
- Create: `cloudfunctions/user/handler.js`
- Create: `cloudfunctions/user/user-repository.js`
- Modify: `cloudfunctions/user/index.js`

- [ ] Implement `loginOrRegister` with default nickname/avatar, role `user`, status `normal`, and idempotent openid behavior.
- [ ] Implement `getCurrentUser`, `updateUserInfo`, `updateUserRole`, and `disableUser`.
- [ ] Keep `role` and `status` protected from ordinary profile updates.
- [ ] Require admin role for role updates and disabling users.

### Task 3: Connect Frontend Login State

**Files:**
- Modify: `miniprogram/app.js`
- Modify: `miniprogram/utils/auth.js`
- Modify: `miniprogram/pages/profile/profile.js`
- Modify: `miniprogram/pages/profile/profile.wxml`
- Modify: `miniprogram/pages/profile/profile.wxss`

- [ ] Load cached current user on app launch.
- [ ] Add login action to profile page.
- [ ] Display nickname, role, status, and phone placeholder on profile page.
- [ ] Preserve worker/admin entry placeholders without implementing later-stage business.

### Task 4: Update Records And Verify

**Files:**
- Create: `docs/dev-records/02_phase-login-user.md`
- Modify: `docs/dev-records/index.md`
- Modify: `README.md`

- [ ] Record phase 2 completed work, database changes, cloud function changes, tests, risks, and next phase plan.
- [ ] Update index P0 status for WeChat login and role system.
- [ ] Run `npm test` and ensure all tests pass.
