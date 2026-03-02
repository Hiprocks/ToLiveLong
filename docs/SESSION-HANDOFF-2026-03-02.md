# Session Handoff (2026-03-02)

## Release Intent
- Real-user feedback based UX fixes and sync stability improvements were completed.
- Focus moved to integrated regression testing before next iteration.

## What Changed

### 1) Client Sync Optimization (Google Sheets fetch reduction)
- Added shared client cache utility: `src/lib/clientSyncCache.ts`
- Replaced TTL-based page-local cache with key-based cache + invalidation flow.
  - keys: `records:{date}`, `templates`, `user`
- Applied to:
  - `src/app/page.tsx` (dashboard)
  - `src/app/history/page.tsx` (history)
  - `src/app/my/page.tsx` (my page)
  - `src/components/FoodSearchModal.tsx` (template/data flow)

### 2) Photo Registration Flow Improvements
- Removed extra upload-step UX and moved to direct file picker invocation.
- Fixed cancel edge cases where photo flow could become unresponsive until refresh.
  - Added focus-return handling and cancel-close safety timing.
- Photo analyze result now supports amount-aware prefill for registration.
  - label image: total content amount basis
  - food image: one-serving estimate basis

### 3) Analyze Payload / Prompt Upgrade
- Extended analyze response schema with:
  - `amount`
  - `amount_basis` (`label_total_content` | `food_serving_estimate`)
- Updated AI prompt to enforce amount basis extraction rules.
- Added/updated payload normalization and tests.

### 4) Korean Food Name Normalization
- Added Korean-first normalization for analyzed menu names.
- If model returns English, server-side mapping attempts Korean conversion.
- Unknown values fallback to `추정 식품`.

### 5) Template UX + Data Consistency
- Template detail popup upgraded to editable form (date excluded), aligned with record-edit style.
- Included `섭취량 대비 영양성분 변동` behavior in template detail editing.
- `수정값 적용` now persists template changes via API (PUT) and syncs list/cache/form.

### 6) Template Ordering Rule
- When using `템플릿 저장 + 등록`, newly created template is surfaced at top immediately.
- Backend template list switched to latest-first order (`reverse()` on sheet rows).
- Records API now returns `templateId` so client can prioritize recent template ordering.

## API Changes
- Updated: `POST /api/sheets/records`
  - response includes `templateId` when template is saved with record.
- Added: `PUT /api/sheets/templates`
  - updates existing template row by template id.

## Validation Result
- `npm.cmd run test:analyze`: pass (7/7)
- `npm.cmd run build`: pass

## Production / Branch
- Production URL: `https://to-live-long.vercel.app`
- Branch: `develop`

## Regression Checklist (Priority)
1. `+ > 사진 등록`:
   - cancel -> re-open should work without refresh.
2. Photo registration:
   - label image uses total content amount basis.
   - food image uses one-serving estimate basis.
3. Template detail popup:
   - edit + apply persists to template list and next reopen.
4. `템플릿 저장 + 등록`:
   - newly saved template appears at top.
5. Cross-page sync:
   - dashboard/history/my reflect post-CRUD state without stale views.

## Next Session Quick Start
1. `git pull origin develop`
2. `npm.cmd install`
3. `npm.cmd run test:analyze`
4. `npm.cmd run build`
5. `npm.cmd run dev`

## Notes
- If photo cancel behavior differs by browser/device, collect:
  - device OS/browser version
  - exact click sequence
  - whether file picker returns focus event
