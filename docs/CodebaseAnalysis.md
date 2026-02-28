# Codebase Analysis (2026-02-27)

This document summarizes the current codebase structure, data flow, and key implementation details so future work can reference a single source of truth.

## 1) Runtime Architecture (High Level)
- Next.js App Router with server API routes under `src/app/api/*`
- Client UI in `src/app/*` and `src/components/*`
- Data persistence via Google Sheets API v4 (`src/lib/sheets.ts`)
- AI integration:
  - Image analysis: `src/app/api/analyze/route.ts`
  - Nutrition target suggestion: `src/lib/nutrition/aiTargets.ts` via `src/app/api/sheets/user/route.ts`

## 2) Pages & UI Flow
- Dashboard: `src/app/page.tsx`
  - Loads daily records + user targets, shows `CalorieGauge`, `IntakeSummaryTable`, `MealTable`
  - Entry sheet opens `FoodSearchModal` (manual/template) and `PhotoAnalysisModal`
- History: `src/app/history/page.tsx`
  - Date filter, list, edit/delete modal
- My: `src/app/my/page.tsx`
  - Profile summary + edit modal (`ProfileEditModal`)
  - Computed nutrition results (`NutritionResultCard`)
- Onboarding: `src/app/onboarding/page.tsx`
  - Uses legacy local calculation in `src/lib/calculations.ts` (not aligned with current profile system)

## 3) Data Model (Types)
- Core types: `src/lib/types.ts`
  - `UserProfileInput`, `NutritionTargets`, `DailyTargets`, `MealRecord`, `TemplateItem`
  - Goals: `cutting | maintenance | bulking | recomposition`
  - Macro preference: `balanced | low_carb | high_protein | keto`
- Nutrition targets: `src/lib/nutrition/calculateTargets.ts`
  - BMR: Mifflin-St Jeor by default, Katch-McArdle when `bodyFatPct` exists
  - Goal calorie multiplier logic (0.8/1.1/1.0 etc.)
  - Macro ratio depends on preference + recomposition protein floor
- AI override: `src/lib/nutrition/aiTargets.ts`
  - Always attempts Gemini if `GEMINI_API_KEY` is present
  - Falls back to baseline on errors or invalid response
  - Optional `aiNotes` (Korean) for UI display

## 4) Google Sheets Integration
Core client: `src/lib/sheets.ts`
- Ranges
  - `records!A:K`
  - `templates!A:I`
  - `user!A:U`
- Profile parsing + serialization
  - `parseUserProfile`, `serializeUserRow`
  - Legacy goals `overfat/obese/severe_obese` are normalized to `cutting`
- Same-origin write guard: `src/lib/apiGuard.ts`
- Input validation: `src/lib/apiValidation.ts`

## 5) API Routes
- `GET/POST /api/sheets/records`: `src/app/api/sheets/records/route.ts`
- `PUT/DELETE /api/sheets/records/[id]`: `src/app/api/sheets/records/[id]/route.ts`
- `GET/POST /api/sheets/templates`: `src/app/api/sheets/templates/route.ts`
- `GET/PUT /api/sheets/user`: `src/app/api/sheets/user/route.ts`
  - GET/PUT both compute `computed` using AI (if available) or baseline
- `POST /api/analyze`: `src/app/api/analyze/route.ts`
  - Gemini image analysis, JSON parsing via `src/lib/analyzePayload.ts`

## 6) Key UI Components
- `FoodSearchModal`: manual/template entry, local recent templates cache
- `PhotoAnalysisModal`: image upload -> Gemini analyze -> confirm + save
- `NutritionResultCard`: shows BMR/TDEE/target + macro; shows `aiNotes` if present
- `ProfileEditModal`: profile input, goal/macro selection, warning for keto + bulk/recomposition
- `BottomNav`: app navigation

## 7) Environment Variables
Required in `.env.local`:
- `GOOGLE_SHEETS_ID`
- `GOOGLE_SERVICE_ACCOUNT_EMAIL`
- `GOOGLE_PRIVATE_KEY`
- `GEMINI_API_KEY`

## 8) Known Gaps / Risks
- `src/lib/calculations.ts` and onboarding flow are legacy and not aligned with the new profile + AI logic.
- AI calls require external network access and valid `GEMINI_API_KEY`.
- Google Sheets schema in `docs/Schema.md` must stay aligned with `serializeUserRow`.

## 9) Test Status
- There is a unit test for analyze payload parsing: `src/lib/analyzePayload.test.ts`
- Most flows rely on manual verification and `npm run lint` / `npm run build`.

## 10) Suggested Next Actions (if requested)
- Align `src/app/onboarding/page.tsx` with `UserProfileInput` and new nutrition logic.
- Add a dedicated logging path for AI failures if debugging is needed.
- Add server-side caching for AI targets to reduce repeated calls.
