# PDCA Design - my-menu-koreanization-goal-expansion

## UI/UX Design
- Use Korean-only labels on primary navigation and main action surfaces.
- Keep numeric input behavior:
  - empty value remains empty
  - required empty fields show red border
  - save actions disabled while required fields are empty
- Keep sectioned My modal layout:
  - basic info (required)
  - activity info
  - body composition (optional)
  - goal settings

## Domain Design
- Extend `PrimaryGoal` enum:
  - `overfat`, `obese`, `severe_obese`
- Remove `targetPaceKgPerWeek` from profile contract.
- Maintain optional body composition fields:
  - `bodyFatPct`
  - `skeletalMuscleKg`

## Backend/API Design
- Accept new goal enum values in user profile parser.
- Recompute targets using goal-based calorie adjustment only.
- Keep spreadsheet compatibility by preserving legacy column position where needed.

## Risk And Mitigation
- Risk: broken strings from encoding issues.
  - Mitigation: rewrite affected files in UTF-8 and verify with build.
- Risk: missed English labels in old pages/modals.
  - Mitigation: run global keyword search and replace.
