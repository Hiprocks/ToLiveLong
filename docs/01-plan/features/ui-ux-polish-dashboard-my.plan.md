# PDCA Plan - ui-ux-polish-dashboard-my

- Feature: `ui-ux-polish-dashboard-my`
- Date: `2026-02-28`
- Current Phase: `Plan`
- Level: `Dynamic`

## 1) Goal
- Improve readability and information density in the Dashboard meal list so key nutrition values are visible without extra clicks.
- Fix missing field labels in the edit flow.
- Reorder sections in My Info page to prioritize "Goal Targets (AI)" and move "AI response test" to the bottom.
- Refresh overall visual design direction (color palette, emphasis, modern hierarchy) while preserving current product structure.

## 2) Scope
### In Scope
- Dashboard meal row UI redesign:
  - Always show: food name, intake amount, calories, carbs, protein, fat, sugar, sodium.
  - Use 1-2 line adaptive layout for mobile readability.
  - Improve typography/color hierarchy for quick scanning.
- Edit modal/form label fix:
  - Ensure every editable input has a persistent field title/label.
- My Info section ordering:
  - Move "Goal Targets (AI)" card to top.
  - Move "AI response test" block to bottom.
- Global UI color refinement:
  - Update design tokens (primary/surface/text/border accent strategy).
  - Apply to key pages: Dashboard, History, My Info, modal surfaces/buttons.

### Out of Scope
- New business logic for nutrition calculations.
- API contract/schema changes.
- New pages/routes or navigation restructuring.
- Full design-system rewrite.

## 3) Functional Requirements
| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-01 | Dashboard meal rows show all key nutrition fields by default (no click required). | High | Pending |
| FR-02 | Meal row supports 1-2 line responsive layout without clipping core values on mobile. | High | Pending |
| FR-03 | Edit flow displays clear field labels/titles for all editable nutrition inputs. | High | Pending |
| FR-04 | My Info page places "Goal Targets (AI)" section at the top. | High | Pending |
| FR-05 | My Info page places "AI response test" section at the bottom. | High | Pending |
| FR-06 | UI color and emphasis hierarchy is modernized across major user screens. | Medium | Pending |

## 4) Non-Functional Requirements
| Category | Criteria | Verification |
|---|---|---|
| Usability | Core nutrition values are readable in one glance on mobile and desktop. | Manual scenario checks on 360px and 1280px widths |
| Accessibility | Contrast for text/UI indicators meets practical readability target (>= WCAG AA where applicable). | Visual review + contrast spot-check |
| Performance | No additional API requests caused by UI changes. | Network tab/manual request count check |
| Stability | Existing create/edit/delete flows remain unchanged functionally. | Regression scenarios for Dashboard/History/My |

## 5) Team Plan (Multi-Role)
### PM
- Freeze acceptance criteria for each requested UI change.
- Define release scope as "UI-only improvement, no API contract changes".

### FE
- Implement row layout and typography/color hierarchy update.
- Fix label rendering in edit modal/form.
- Reorder My Info sections.
- Apply token-level color adjustments and component-level tuning.

### BE
- Confirm no API changes required.
- Support FE with payload/field naming consistency checks only.

### QA
- Prepare regression checklist:
  - Dashboard load/readability
  - Edit modal labels
  - My Info section order
  - Mobile/desktop visual checks
  - Existing API-backed flows unaffected

## 6) Definition of Done
- [ ] Dashboard rows show all requested fields without user click.
- [ ] Requested fields remain readable in 1-2 lines on mobile.
- [ ] Edit inputs consistently show field labels.
- [ ] My Info order change is applied exactly as requested.
- [ ] Updated color hierarchy is visible and consistent on major screens.
- [ ] `npm run lint` passes.
- [ ] `npm run build` passes.
- [ ] Manual regression checklist has no critical issue.

## 7) Risks and Mitigation
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| Dense meal row may look crowded on small screens | Medium | Medium | Use two-line adaptive layout with clear typographic tiers and spacing tokens |
| Color refresh may reduce contrast on some components | High | Medium | Apply token-first changes and run contrast spot-check on key text/button states |
| Section reorder may break user expectation or component state assumptions | Medium | Low | Keep same component logic/state; change render order only |

## 8) Delivery Sequence
1. Dashboard meal row information visibility redesign.
2. Edit label/title consistency fix.
3. My Info section reorder.
4. Global color hierarchy pass.
5. Lint/build/regression validation.

## 9) Next Phase
- Next: `Design`
- Command suggestion: `$pdca design ui-ux-polish-dashboard-my`
