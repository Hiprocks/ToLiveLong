# PDCA Design - template-db-integration-phase1

- Feature: `template-db-integration-phase1`
- Date: `2026-03-03`
- Phase: `Design`
- Level: `Dynamic`
- Plan: `docs/01-plan/features/template-db-integration-phase1.plan.md`

## 1) Design Goals
- 템플릿 탭에서 검색 진입점 하나로 템플릿 + DB 탐색을 모두 처리한다.
- 사용자가 결과 출처를 즉시 구분할 수 있게 시각적 라벨을 제공한다.

## 2) UI Design
- 대상 파일: `src/components/FoodSearchModal.tsx`
- 탭 구조:
  - 1차에서는 `수기/템플릿/DB검색` 유지
- 템플릿 탭 검색 UI:
  - 플레이스홀더: `템플릿 + 음식 DB 통합 검색`
  - 설명 문구: 템플릿 우선 + DB 결과 함께 표시
  - 리스트 순서:
    1) 템플릿 목록
    2) `음식 DB 결과` 섹션
  - DB 카드 시각 구분:
    - cyan 계열 배경/보더
    - `음식DB` 배지

## 3) Data Flow Design
- DB 검색 fetch effect 트리거:
  - 기존: `mode === "database"`
  - 변경: `mode !== "manual"` (템플릿 탭 포함)
- 검색어 비어 있으면 DB 결과 초기화
- 캐시(`dbResultCache`) 재사용 유지

## 4) Regression Safety
- 템플릿 선택 시 기존 `applyTemplate` 경로 유지
- DB 선택 시 기존 `applyDatabaseFood` 경로 재사용
- 템플릿 상세/수정/삭제 로직 영향 없음

## 5) Verification Plan
- 템플릿 탭에서 검색어 입력 시 상단 템플릿 + 하단 DB 결과 노출 확인
- DB 카드의 배지/색상 확인
- DB검색 탭 기존 동작 유지 확인
- `npm run lint`

## 6) Next Phase
- Next: `Do`
