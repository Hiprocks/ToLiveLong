# PDCA Plan - template-db-integration-phase2

- Feature: `template-db-integration-phase2`
- Date: `2026-03-03`
- Current Phase: `Plan`
- Level: `Dynamic`

## 1) Goal
- 식단 등록 진입에서 독립 `DB검색` 메뉴를 제거한다.
- DB 탐색은 템플릿 탭 통합 검색 경로로 일원화한다.

## 2) Scope
### In Scope
- 대시보드 `+` 메뉴: `DB검색` 항목 제거
- 기록 `+` 메뉴: `DB검색` 항목 제거
- 식단등록 탭: `수기/템플릿` 2탭으로 정리

### Out of Scope
- 템플릿 탭 내부의 DB 통합 검색/카드/상세 UI 변경

## 3) Definition of Done
- [ ] 대시보드/기록 `+` 메뉴에 DB검색 항목이 없다.
- [ ] FoodSearchModal에 DB검색 탭이 없다.
- [ ] 템플릿 탭에서 DB 통합 검색은 유지된다.
- [ ] `npm run lint` 통과

## 4) Next Phase
- Next: `Design`
