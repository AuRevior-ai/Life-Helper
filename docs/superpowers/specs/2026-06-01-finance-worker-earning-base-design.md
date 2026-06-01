# Stage 16 Finance Worker Earning Base Design

## Goal

Build the minimum finance foundation for the existing MVP: generate internal finance logs and worker earning records after mock-paid orders are completed, show worker income from the finance ledger, support refund reversal, and give admins read-only finance views.

## Scope

This stage does:

- Add `finance_logs` as the platform finance audit log.
- Add `worker_earnings` as the worker-side earning ledger.
- Add a new `finance` cloud function.
- Generate finance records after successful review and order completion.
- Reverse finance records after mock refund succeeds.
- Replace the worker income page data source with finance summary and earning list.
- Add simple admin finance list/detail pages.
- Add tests and a stage development report.

This stage does not:

- Add real withdrawal.
- Add WeChat Pay split/settlement.
- Add partner commission.
- Add wallet balance.
- Add dynamic commission settings UI.

## Architecture

`cloudfunctions/finance` is the authoritative finance domain. Order, review, and refund functions keep their current business responsibilities and call finance use cases only at the business boundary: after order completion and after refund success.

Finance calculations use integer cents. The default platform commission is fixed in `finance-config.js` as 1500 basis points, and the worker earning freeze period is 7 days. The order document stores snapshots for quick inspection, while `finance_logs` and `worker_earnings` remain the detailed source of truth.

## Finance Log Model

Collection: `finance_logs`

Important fields:

- `finance_no`
- `order_id`
- `order_no`
- `user_id`
- `worker_id`
- `type`
- `direction`
- `amount`
- `order_amount`
- `paid_amount`
- `commission_rate`
- `commission_rate_bps`
- `platform_commission_amount`
- `worker_earning_amount`
- `status`
- `source`
- `remark`
- `error_message`
- `created_at`
- `updated_at`
- `created_by`

## Worker Earning Model

Collection: `worker_earnings`

Important fields:

- `earning_no`
- `order_id`
- `order_no`
- `user_id`
- `worker_id`
- `order_amount`
- `paid_amount`
- `commission_rate`
- `commission_rate_bps`
- `platform_commission_amount`
- `worker_earning_amount`
- `status`
- `settlement_status`
- `freeze_days`
- `frozen_until`
- `settled_at`
- `reversed_at`
- `refund_id`
- `refund_amount`
- `remark`
- `created_at`
- `updated_at`

## Order Snapshot Fields

Orders may receive these finance snapshot fields:

- `finance_generated`
- `finance_generated_at`
- `finance_no`
- `earning_no`
- `settlement_status`
- `commission_rate`
- `commission_rate_bps`
- `platform_commission_amount`
- `worker_earning_amount`
- `finance_reverse_status`
- `finance_reversed_at`

## Idempotency

Finance generation checks both `orders.finance_generated` and existing active `worker_earnings` by `order_id`. Repeated generation does not create duplicate records and returns an explicit already-generated result.

Refund reversal checks the earning status and existing reverse state. Repeated reversal does not duplicate reverse logs. If an earning has already been settled, the system marks it as manual handling required instead of pretending that funds were automatically recovered.

## Permissions

Worker actions:

- `getWorkerIncomeSummary`
- `getWorkerEarningList`

These only read records for the current `openid`.

Admin actions:

- `adminGetFinanceLogs`
- `adminGetWorkerEarnings`
- `adminGetOrderFinanceDetail`
- `mockUnlockSettlement`

These require an active admin user.

## Error Handling

Review completion remains the user-facing source of truth for order completion. If finance generation fails after review succeeds, the order remains completed and can be repaired by calling `generateOrderFinance` again. This avoids rolling back a successful review/order completion because finance generation is designed to be idempotent and retryable.

Refund reversal is also retryable. For settled earnings, it creates a manual-required state instead of automatic deduction.

## Testing

Add `tests/phase16.finance-worker-earning.test.js` to cover:

- Successful finance generation.
- Commission and worker earning calculation.
- Duplicate generation idempotency.
- Invalid unpaid/incomplete/missing-worker orders.
- Worker income permission boundaries.
- Admin finance reads.
- Mock refund reversal.
- Settled earning manual handling.
- Route, service, constant, and documentation wiring.

