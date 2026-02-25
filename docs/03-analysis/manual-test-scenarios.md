# Manual Test Scenarios

Date: 2026-02-25
Scope: Meal registration flow, template flow, photo analysis flow, history updates, user targets

## 1. Manual Entry Save
- Precondition: Dashboard loaded
- Steps:
  1. Tap `+`
  2. Select `Manual entry`
  3. Fill required fields (`Food Name`, `Amount`)
  4. Tap `Save Record`
- Expected:
  - Save completes without error
  - Success flash banner shown on dashboard
  - New record appears in Today list

## 2. Template Entry With Amount Recalculation
- Precondition: At least one template exists
- Steps:
  1. Tap `+`
  2. Select `Use template`
  3. Search and select a template
  4. Change `Amount`
  5. Tap `Save Record`
- Expected:
  - Nutrition values recalculate based on amount
  - Save succeeds and record is added
  - Recent template appears earlier in subsequent searches

## 3. Photo Analysis Save
- Precondition: Valid image file available
- Steps:
  1. Tap `+`
  2. Select `Analyze photo`
  3. Upload image
  4. Review/edit analyzed fields
  5. Tap `Save Record`
- Expected:
  - Analysis result fills nutrition fields
  - Save succeeds and success flash banner appears

## 4. Validation Errors
- Steps:
  1. Open manual or photo confirm form
  2. Leave `Food Name` empty or set `Amount` to 0
  3. Tap save
- Expected:
  - Save is blocked
  - Error banner explains missing/invalid input

## 5. History Update/Delete Regression
- Steps:
  1. Go to History
  2. Edit one item and save
  3. Delete one item
- Expected:
  - Updated values persist
  - Deleted row no longer appears

## 6. Target Update Regression
- Steps:
  1. Go to My Targets
  2. Change one or more values
  3. Save
  4. Return to Dashboard
- Expected:
  - Save succeeds
  - Dashboard gauge/summary use updated targets
