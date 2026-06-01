# Stage 17 Member Coupon Base Design

## Goal

Add basic membership and coupon marketing without changing the existing MVP order, payment, refund, and finance flows.

## Scope

This stage adds:

- Member plans and mock membership opening.
- User membership status.
- Coupon templates and user coupons.
- Backend order promotion calculation.
- Single-coupon lock, use, and release.
- Order marketing snapshots.
- User member center, coupon center, and coupon receive pages.
- Admin member plan list and coupon template management pages.
- Promotion tests and stage documentation.

This stage does not add:

- Real member payment.
- Auto renewal.
- Multiple coupons per order.
- Sharing or growth campaigns.
- Points, stored-value cards, partner commissions, or real payment changes.

## Architecture

Add `cloudfunctions/promotion` as the promotion domain. The order cloud function asks promotion helpers to calculate discounts, lock coupons after order creation, mark coupons used after mock payment, and release locked coupons on unpaid cancellation.

The frontend only selects a coupon and displays calculated snapshots. The backend always recalculates membership and coupon discounts from service price, membership state, and coupon state. Finance continues to use `order.pay_amount`, which becomes the payable amount after promotion discounts.

## Money Rules

All amounts use cents. The order stores:

- `original_amount`
- `member_discount_amount`
- `coupon_discount_amount`
- `total_discount_amount`
- `payable_amount`
- `price`
- `pay_amount`

Compatibility:

- `price = original_amount`
- `pay_amount = payable_amount`

## Promotion Rules

Calculation order:

1. Service original amount.
2. Member discount.
3. One coupon deduction.
4. Final payable amount.

Coupon status flow:

- `unused` -> `locked` when order is created.
- `locked` -> `used` when payment succeeds.
- `locked` -> `unused` when unpaid order is canceled.

Refund policy:

- Paid/refunded coupons are not automatically returned in this stage.

## Permissions

Users may only operate their own membership and coupons. Admin actions require an active admin user. Orders may only use current user's unused, valid coupons.

