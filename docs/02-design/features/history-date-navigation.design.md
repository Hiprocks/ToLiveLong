# PDCA Design - history-date-navigation

- Feature: `history-date-navigation`
- Date: `2026-03-03`
- Phase: `Design`
- Plan Doc: `docs/01-plan/features/history-date-navigation.plan.md`

## 1) UI Design
- 위치: `src/app/history/page.tsx` 상단 날짜 필터 영역
- 구성:
  - 좌측 `<` 버튼: 하루 이전 이동
  - 중앙 날짜 영역: 현재 조회 날짜 표시 + 클릭 시 date picker 오픈
  - 우측 `>` 버튼: 하루 이후 이동

## 2) State and Logic
- 기존 상태 `date` 재사용
- 기준 날짜 `today = getLocalDateString()`
- `isAtToday = date >= today`
- `moveDateByDays(days)`
  - `addDays(parseISO(date), days)`로 다음 날짜 계산
  - 계산 결과가 `today`보다 미래면 상태 업데이트 차단
- `openDatePicker()`
  - 지원 브라우저: `showPicker()`
  - 미지원 브라우저: `focus + click` 폴백

## 3) Constraints
- API 변경 없음: 기존 `load(date)` 흐름 유지
- 미래 날짜 금지: 버튼/datepicker 양쪽 모두 적용

## 4) Test Plan
1. 오늘 날짜 진입 시 `>` 비활성화
2. 오늘 이전 날짜에서 `<`/`>` 이동 정상 동작
3. 미래 날짜로 이동 시도 차단
4. 중앙 날짜 영역 클릭으로 임의 과거 날짜 선택 후 데이터 재조회

## 5) Next Phase
- Next: `Do`
