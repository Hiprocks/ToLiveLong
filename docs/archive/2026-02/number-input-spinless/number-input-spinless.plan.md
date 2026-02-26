# PDCA 계획서 - number-input-spinless

- 기능명: `number-input-spinless`
- 작성일: `2026-02-26`
- 담당 역할: PM / FE / BE / QA
- 현재 단계: Plan

## 1) 목표
모든 `number` 입력 UI에서 브라우저 기본 위/아래(stepper) 컨트롤을 제거해 숫자 직접 입력 중심 UX로 통일한다.

## 2) 범위
### 포함 범위 (In Scope)
- 전역 CSS 기준으로 모든 `input[type="number"]` stepper 제거
- 기존 숫자 입력 기능/검증 로직 유지
- lint/build 검증

### 제외 범위 (Out of Scope)
- 입력 상태 모델 재설계(문자열 상태 전환 등)
- 숫자 입력 UX 추가 개선(자동 전체선택, 포맷터 등)

## 3) 완료 기준 (Definition of Done)
- 주요 숫자 입력 화면에서 stepper가 보이지 않는다.
- 입력/저장 기능이 기존과 동일하게 동작한다.
- `npm run lint`, `npm run build` 통과

## 4) 리스크 및 대응
- 리스크: 브라우저별 스타일 차이
  - 대응: WebKit + Firefox 모두 대응하는 CSS 규칙 적용

## 5) 산출물
- 코드:
  - `src/app/globals.css`
- 문서:
  - `docs/01-plan/features/number-input-spinless.plan.md`
  - `docs/02-design/features/number-input-spinless.design.md`
  - `docs/03-analysis/number-input-spinless.analysis.md`
  - `docs/04-report/features/number-input-spinless.report.md`

## 6) 다음 단계
- 다음 단계: Design
- 실행 명령: `$pdca design number-input-spinless`
