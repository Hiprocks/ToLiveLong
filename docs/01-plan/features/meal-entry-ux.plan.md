# PDCA 계획서 - meal-entry-ux

- 기능명: meal-entry-ux
- 작성일: 2026-02-25
- 담당 역할: PM / FE / BE / QA
- 현재 단계: Plan

## 1) 목표
식단 등록 진입/입력/저장 흐름을 단순화하고, 실패/성공 피드백을 일관되게 제공하여 입력 성공률과 완료 속도를 개선한다.

## 2) 범위
### 포함 범위 (In Scope)
- 대시보드에서 단일 `+` 버튼 기반 등록 진입
- 수기/템플릿/사진분석 모드 선택 흐름 정리
- 등록 폼 필수값 검증(`food_name`, `amount >= 1`)
- 저장 상태 표준화(`idle -> saving -> success/error`)
- 템플릿 최근 사용 우선 정렬 정책(클라이언트)
- 수동 테스트 시나리오 문서화

### 제외 범위 (Out of Scope)
- 템플릿 즐겨찾기 DB 스키마/API 확장
- 사용자 권한/멀티유저 기능
- 대규모 디자인 시스템 개편

## 3) 완료 기준 (Definition of Done)
- 사용자는 2클릭 이내로 등록 모드 선택 가능
- 필수값 누락 시 저장 요청이 차단되고 명확한 메시지가 표시됨
- 저장 성공 시 대시보드에서 일관된 성공 피드백 표시
- 등록 실패 시 에러 배너 메시지로 원인 확인 가능
- `npm run lint` 및 `npm run build` 통과
- 수동 테스트 시나리오 문서 완성

## 4) 기능 요구사항
1. 등록 진입 흐름
- 단일 FAB에서 3개 모드로 진입 가능해야 함
- 모드 선택 레이어는 모바일에서 조작 가능해야 함

2. 입력 검증
- food_name은 공백 trim 후 비어있으면 실패
- amount는 1 이상 정수/숫자여야 함

3. 저장 피드백
- 저장 중 버튼 비활성화
- 저장 성공 시 전역 성공 피드백
- 저장 실패 시 에러 배너 표시

4. 템플릿 UX 정책
- 검색 + 선택 기본 정책 유지
- 최근 사용 템플릿 우선 정렬
- 즐겨찾기는 정책만 확정하고 구현 보류

## 5) 비기능 요구사항
- 모바일 우선 레이아웃 유지
- 기존 API 계약과 호환
- 회귀 최소화를 위한 린트/빌드 게이트 유지

## 6) 리스크 및 대응
- 리스크: 모달 상태 전환 복잡도 증가
  - 대응: 상태 모델 단순화(`mode`, `saveState`) 및 초기화 루틴 통일
- 리스크: 템플릿 정렬 정책 오해
  - 대응: 문서에 정책 명시, favorites 미구현 상태를 명확히 표시
- 리스크: 테스트 자동화 부족
  - 대응: 수동 테스트 시나리오 문서 우선 확보

## 7) 산출물
- 코드:
  - `src/app/page.tsx`
  - `src/components/FoodSearchModal.tsx`
  - `src/components/PhotoAnalysisModal.tsx`
- 문서:
  - `docs/overview.md`
  - `docs/Context.md`
  - `docs/Todo.md`
  - `docs/03-analysis/manual-test-scenarios.md`
  - `docs/.pdca-status.json`

## 8) 다음 단계
- 다음 단계: Design
- 실행 명령: `$pdca design meal-entry-ux`
