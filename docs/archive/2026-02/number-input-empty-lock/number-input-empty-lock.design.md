# PDCA 설계서 - number-input-empty-lock

- 기능명: `number-input-empty-lock`
- 작성일: `2026-02-27`
- 현재 단계: Design
- 계획 문서: `docs/01-plan/features/number-input-empty-lock.plan.md`

## 1) 설계 목표
- 숫자 입력의 표시 상태를 `number` 값이 아니라 문자열 draft로 관리해 빈 입력을 보존한다.
- 필수 필드 미입력 여부를 UI 상태로만 표시하고 저장 가능 조건을 제어한다.

## 2) 설계 상세
1. 상태 모델
- 기존: `number` 상태 + `Number(value) || 0`
- 변경: `string` draft 상태 (`""` 허용)

2. 저장 가능 조건
- 필수 숫자 필드(`age`, `heightCm`, `weightKg`) 중 하나라도 비어 있으면 저장 버튼 비활성화

3. 시각 규칙
- 필수 입력이 빈 문자열이면 해당 input border를 `red`로 표시
- 클라이언트 검증 오류 문구는 노출하지 않음

4. 데이터 변환
- 저장 시점에만 string -> number/undefined 변환
- 서버 검증은 기존 API 규칙을 그대로 사용

## 3) 테스트 계획
- 수동:
  - 필수 숫자 필드 삭제 후 빈 상태 유지 확인
  - 빈 상태에서 Save 비활성화 확인
  - 미입력 필드 붉은 테두리 확인
- 자동:
  - `npm run lint`
  - `npm run build`

## 4) 다음 단계
- 다음 단계: Do
- 실행 명령: `$pdca do number-input-empty-lock`
