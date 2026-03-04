# PDCA Plan - template-db-integration-phase1

- Feature: `template-db-integration-phase1`
- Date: `2026-03-03`
- Current Phase: `Plan`
- Level: `Dynamic`

## 1) Goal
- 식단 등록의 템플릿 탭에서 템플릿 결과와 음식 DB 결과를 통합 표시한다.
- 기존 템플릿 기능(선택/수정/삭제/최근순)은 유지한다.

## 2) Scope
### In Scope
- 템플릿 검색 시:
  - 템플릿 목록을 상단에 우선 표시
  - 음식 DB 결과를 하단에 추가 표시
- 음식 DB 결과 카드에 `음식DB` 배지/색상으로 시각 구분
- DB 검색 탭은 1차에서 유지

### Out of Scope
- 2차: 대시보드 `+` 메뉴에서 DB검색 메뉴 제거
- 템플릿 데이터 스키마/API 변경

## 3) Functional Requirements
| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-01 | 템플릿 탭 검색 시 템플릿과 DB 결과를 함께 표시한다. | High | Pending |
| FR-02 | 템플릿 결과는 DB 결과보다 위에 표시한다. | High | Pending |
| FR-03 | DB 결과 카드에 `음식DB` 시각 배지를 표시한다. | High | Pending |
| FR-04 | 기존 템플릿 상세/수정/삭제 흐름을 유지한다. | High | Pending |

## 4) Definition of Done
- [ ] 템플릿 탭 통합 검색 동작 확인
- [ ] 템플릿 상단, DB 하단 순서 확인
- [ ] DB 카드 `음식DB` 배지/색상 확인
- [ ] 기존 템플릿 기능 회귀 없음
- [ ] `npm run lint` 통과

## 5) Next Phase
- Next: `Design`
