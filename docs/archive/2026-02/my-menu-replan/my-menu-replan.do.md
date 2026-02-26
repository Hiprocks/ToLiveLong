# PDCA Do Log - my-menu-replan

- Feature: `my-menu-replan`
- Date: `2026-02-26`
- Phase: Do

## Implemented
- Added profile data model and response types for My feature.
- Added nutrition calculation module based on design formula and PAL mapping.
- Extended user sheet parsing/serialization to support profile + targets in one row.
- Upgraded `GET/PUT /api/sheets/user` to support:
  - legacy targets payload (backward compatibility)
  - profile payload with server-side recalculation
- Reworked My page UX:
  - auto-open edit modal for unregistered users
  - section-based summary view for registered users
  - fixed bottom `Edit` CTA
- Added My feature components:
  - `ProfileSummarySection`
  - `ProfileEditModal`

## Verification
- `npm run lint`: pass
- `npm run build`: pass

## Next
- Run analyze/check phase:
  - `$pdca analyze my-menu-replan`
