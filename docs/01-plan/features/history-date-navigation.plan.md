# PDCA Plan - history-date-navigation

- Feature: `history-date-navigation`
- Date: `2026-03-03`
- Roles: `PM / FE / QA`
- Phase: `Plan`

## 1) Goal
- 기록 화면 상단에서 날짜 이동을 더 빠르게 수행할 수 있도록 일자 네비게이션 UI를 제공한다.
- 사용자가 현재 조회 중인 날짜를 중앙에서 즉시 인지할 수 있게 한다.
- 오늘 날짜 이후(미래)로 이동하는 동작을 차단한다.

## 2) Scope
### In Scope
- 기록 화면(`/history`) 상단에 좌/우 하루 이동 버튼(`<`, `>`) 추가
- 중앙 날짜 표시 추가
- 중앙 날짜 영역 클릭으로 네이티브 date picker 호출
- 오늘 날짜일 때 `>` 버튼 비활성화
- date picker에서 미래 날짜 선택 제한(`max=today`)

### Out of Scope
- 히스토리 필터 확장(주/월 단위 이동, 달력 커스텀 컴포넌트)
- API 변경 및 데이터 모델 변경

## 3) Success Criteria (DoD)
- `<` 클릭 시 하루 이전 날짜로 이동한다.
- `>` 클릭 시 하루 이후 날짜로 이동하되, 오늘 날짜에서는 비활성화된다.
- 중앙에 현재 조회 날짜(YYYY-MM-DD)가 표시된다.
- 중앙 날짜 영역 클릭으로 특정 날짜 선택이 가능하다.
- 미래 날짜는 선택/이동되지 않는다.

## 4) Risks and Mitigation
- 리스크: 브라우저별 `showPicker` 지원 차이
- 대응: `showPicker` 미지원 시 `focus + click` 폴백 제공

## 5) Validation Plan
- 수동 검증
- 시나리오:
  1. 과거 날짜에서 `>` 연타 시 오늘에서 멈추는지 확인
  2. 오늘 날짜에서 `>` 비활성화 확인
  3. `<`로 이전 날짜 이동 시 기록 조회 반영 확인
  4. 중앙 날짜 영역 클릭으로 특정 과거 날짜 선택 확인

## 6) Next Phase
- Next: `Design`
- Command: `$pdca design history-date-navigation`
