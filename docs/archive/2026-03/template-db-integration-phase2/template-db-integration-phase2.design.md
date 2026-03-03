# PDCA Design - template-db-integration-phase2

- Feature: `template-db-integration-phase2`
- Date: `2026-03-03`
- Phase: `Design`
- Level: `Dynamic`
- Plan: `docs/01-plan/features/template-db-integration-phase2.plan.md`

## 1) Design Goals
- DB검색의 독립 진입점을 제거해 사용 흐름을 단순화한다.
- 템플릿 탭 중심 탐색 정책을 UI 전체에서 일관되게 만든다.

## 2) UI Design
- `src/app/page.tsx`
  - `+` 메뉴의 `DB 검색` 버튼 제거
  - `foodModalMode` 타입을 `manual | template`로 제한
- `src/app/history/page.tsx`
  - `+` 메뉴의 `DB 검색` 버튼 제거
  - `foodModalMode` 타입을 `manual | template`로 제한
- `src/components/FoodSearchModal.tsx`
  - 탭을 `수기/템플릿` 2개로 축소
  - `initialMode`, `mode` 타입에서 `database` 제거
  - 템플릿 탭 내 DB 통합 리스트는 그대로 유지

## 3) Verification Plan
- 대시보드/기록 `+` 메뉴에서 DB검색 버튼 미노출 확인
- 식단등록 상단 탭이 2개(수기/템플릿)인지 확인
- 템플릿 탭 검색 시 DB 결과가 표시되는지 확인
- `npm run lint`

## 4) Next Phase
- Next: `Do`
