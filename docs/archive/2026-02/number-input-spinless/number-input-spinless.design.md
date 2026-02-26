# PDCA 설계서 - number-input-spinless

- 기능명: `number-input-spinless`
- 작성일: `2026-02-26`
- 현재 단계: Design
- 계획 문서: `docs/01-plan/features/number-input-spinless.plan.md`

## 1) 설계 목표
- 코드 변경 최소화로 전체 숫자 입력 UI 일관성을 확보한다.
- 컴포넌트별 수정 대신 전역 스타일에서 일괄 제어한다.

## 2) 설계 원칙
- 전역 적용: `input[type="number"]`를 직접 타겟
- 브라우저 호환:
  - WebKit: `::-webkit-inner/outer-spin-button` 제거
  - Firefox: `-moz-appearance: textfield`
- 기능 무변경: 값 파싱/검증/저장은 기존 로직 유지

## 3) 변경 설계
1. `src/app/globals.css`에 다음 규칙 추가
- WebKit stepper 제거
- number input appearance를 textfield로 강제

2. 검증
- 숫자 입력이 있는 주요 페이지(`onboarding`, `history`, `my`, meal modals)에서 stepper 미노출 확인
- lint/build 확인

## 4) 테스트 계획
- 수동:
  - 각 화면 number input 렌더 확인
  - 키보드 입력 및 저장 동작 확인
- 자동:
  - `npm run lint`
  - `npm run build`

## 5) 다음 단계
- 다음 단계: Do
- 실행 명령: `$pdca do number-input-spinless`
