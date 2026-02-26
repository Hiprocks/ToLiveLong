# PDCA Plan - my-menu-koreanization-goal-expansion

- Feature: `my-menu-koreanization-goal-expansion`
- Date: `2026-02-26`
- Phase: Plan

## Goal
- Replace user-facing English menu names with Korean labels.
- Expand My goal options with `과지방`, `비만`, `고도비만`.
- Remove target pace from My profile flow.
- Add optional selectors for `체지방률` and `골격근량`.

## Scope
- In scope:
  - `My` profile registration/edit UX and domain mapping.
  - Main navigation and key user-facing menu labels to Korean.
  - Calculation and API flow updates for new goal options.
- Out of scope:
  - Deployment architecture changes.
  - New medical recommendation logic.

## Definition Of Done
- No user-facing primary menu labels in English.
- New goal options available end-to-end (UI, API parse, calculation).
- Target pace input removed from My profile.
- Body fat and skeletal muscle are optional editable inputs.
- Quality gates pass: `npm run lint`, `npm run build`.
