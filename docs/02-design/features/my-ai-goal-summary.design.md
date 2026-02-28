# PDCA 설계서 - my-ai-goal-summary

- 기능명: `my-ai-goal-summary`
- 작성일: `2026-02-27`
- 현재 단계: Design
- 계획 문서: `docs/01-plan/features/my-ai-goal-summary.plan.md`

## 1) 설계 목표
- AI 응답 notes에 요구사항을 강제한다.
- notes 길이를 200자로 제한한다.
- fallback notes도 동일 형식으로 제공한다.

## 2) 설계 상세
- 프롬프트에 요구사항(200자, 개조식, 조언 포함)을 명시
- `normalizeAiTargets`에서 notes 길이 자르기
- `buildFallbackNotes`에 BMR/TDEE/목표 칼로리/매크로/조언 포함

## 3) 테스트 계획
- 수동: AI 응답 notes 길이와 내용 확인
- 자동: `npm run lint`, `npm run build` (요청 시)

## 4) 다음 단계
- 다음 단계: Do
