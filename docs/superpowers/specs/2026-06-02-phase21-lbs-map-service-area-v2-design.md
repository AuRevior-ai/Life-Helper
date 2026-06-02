# Phase 21 LBS Map Service Area V2 Design

## Goal

Upgrade the phase 15 text-community service area model into a mock-safe LBS service range model with map point fields, latitude/longitude address snapshots, radius matching, administrative-area matching, distance sorting, and LBS-aware order hall / admin assignment filtering.

## Scope

This phase adds LBS matching and map-selection scaffolding only. It does not implement automatic dispatch, AI dispatch, route planning, ETA, real-time tracking, polygon fences, multi-point radius models, automatic pricing, real payment, withdrawal, or split settlement.

## Default Decisions

- Radius mode has priority over administrative-area mode.
- If radius mode cannot run because the order or provider lacks coordinates, matching falls back to administrative-area / legacy community matching.
- The fallback result records `LOCATION_MISSING` or `LEGACY_COMPAT` style reasons so later debugging can see why radius did not decide the result.
- `service_providers` is the preferred long-term LBS authority, while `workers` and `merchants` retain mirrored fields for current pages and compatibility.
- No map key is hardcoded. The map page supports a lightweight mock/manual selection fallback.

## Architecture

Create shared LBS utilities in `cloudfunctions/_shared/lbs-utils.js` and a frontend mirror in `miniprogram/utils/lbs.js`. The backend utility owns distance calculation, administrative matching, provider range matching, and distance sorting. Existing cloud functions call the shared utility instead of keeping local text-only matching.

## Backend Changes

- `address`: normalize and persist coordinate, POI, adcode, and map source fields.
- `order`: save address LBS fields in both flat compatibility fields and `address_snapshot`.
- `area`: persist service-area center point and map metadata; add map-list and location-update actions.
- `worker`: accept service range fields and use LBS matching in order hall.
- `dispatch`: use LBS matching for `getAssignableWorkers`, `adminAssignOrder`, and new `getAssignableProviders`.
- `merchant`: mirror service range fields to `service_providers`; sort store list by distance when location is supplied.

## Frontend Changes

- Add `pages/map/pick-location` as a mock-safe map/manual point picker.
- Add `pages/provider/service-range` as a basic service range editor surface.
- Register new routes and service actions.

## Documentation

Add `docs/map-lbs-setup.md` and `docs/dev-records/21_lbs-map-service-area-v2.md`, then update README, `docs/dev-records/index.md`, and `docs/release-package-checklist.md`.

## Testing

Add `tests/phase21.lbs-map-service-area-v2.test.js` before implementation. It verifies LBS utility behavior, address/order snapshots, service-area location fields, provider service range fields, order hall filtering, admin assignment filtering, distance sorting, and required documentation.
