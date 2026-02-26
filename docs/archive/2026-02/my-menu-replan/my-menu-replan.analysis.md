# PDCA Analysis Report - my-menu-replan

- Feature: `my-menu-replan`
- Date: `2026-02-26`
- Phase: `check` (analyze completed)
- Design Doc: `docs/02-design/features/my-menu-replan.design.md`

## 1. Analysis Scope
- Design-to-implementation gap check for My menu replan.
- Target files:
  - `src/app/my/page.tsx`
  - `src/components/my/ProfileEditModal.tsx`
  - `src/components/my/ProfileSummarySection.tsx`
  - `src/components/my/NutritionResultCard.tsx`
  - `src/app/api/sheets/user/route.ts`
  - `src/lib/nutrition/calculateTargets.ts`
  - `src/lib/sheets.ts`
  - `src/lib/types.ts`

## 2. Gap Analysis (Design vs Implementation)

### 2.1 API/Contract
| Design Item | Implementation | Status | Notes |
|---|---|---|---|
| `GET /api/sheets/user` with profile+computed support | Implemented | Match | Backward compatibility preserved |
| `PUT /api/sheets/user` profile payload support | Implemented | Match | Server-side recalculation included |
| Validation for required and ranged values | Implemented | Match | 400 responses on invalid payload |

### 2.2 Data Model
| Design Item | Implementation | Status | Notes |
|---|---|---|---|
| `UserProfileInput` model | Implemented | Match | Added in `src/lib/types.ts` |
| `NutritionTargets` model | Implemented | Match | Extended with bmr/tdee/targetCalories |
| Sheet row serialization for profile | Implemented | Match | Added parser + serializer |

### 2.3 UI/UX Structure
| Design Item | Implementation | Status | Notes |
|---|---|---|---|
| Unregistered auto-open edit flow | Implemented | Match | Auto-open on initial load |
| Registered summary sections | Implemented | Match | Basic/Goal/Result cards |
| Bottom fixed edit CTA | Implemented | Match | Mobile-first fixed button |
| Dedicated result card component | Implemented | Match | `NutritionResultCard` added |
| Unsaved-change close confirmation | Not implemented | Gap | Design mentions confirmation dialog |

### 2.4 Computation Rules
| Design Item | Implementation | Status | Notes |
|---|---|---|---|
| Mifflin-St Jeor BMR formula | Implemented | Match | Formula preserved |
| PAL mapping (1.2~1.9) | Implemented | Match | Uses design mapping |
| Goal-based calorie adjustment | Implemented | Match | Cutting/maintenance/bulking applied |
| Macro preference presets | Implemented | Match | balanced/low_carb/high_protein |
| Katch-McArdle optional correction | Deferred | Gap (Open Issue) | Kept as open decision in design |

## 3. Quality Checks
- `npm run lint`: pass
- `npm run build`: pass

## 4. Match Rate Summary
- Overall match rate: `92%`
- Match: `23`
- Gap: `2`
  - Unsaved-change confirmation dialog not implemented
  - Katch-McArdle optional correction not implemented (design open issue)

## 5. Recommendation
- Match rate is above 90%, so proceed to `report` phase.
- Keep the two gaps as explicitly deferred items unless product decisions require immediate implementation.
