# PDCA Design - meal-entry-ai-registration

- Feature: `meal-entry-ai-registration`
- Date: `2026-03-04`
- Phase: `Design`
- Based on: `docs/01-plan/features/meal-entry-ai-registration.plan.md`

## 1) Design Goal
- 자연어 기반 `AI 등록` 입력을 기존 수기 등록 흐름으로 안전하게 연결한다.
- AI 처리 중 상태(진행/잠금)를 명확히 표시해 중복 요청을 방지한다.
- AI 응답의 구조화 영양 수치를 기존 검증/정규화 체계에 맞춘다.

## 2) UI/Flow
1. 대시보드 `+` 메뉴
   - 순서: `템플릿 사용` -> `AI 등록` -> `DB 검색` -> `수기 입력` -> `사진 등록`
2. `AI 등록` 클릭
   - `TextAnalysisModal` 오픈
   - 설명 문구 + 예시 노출
   - 텍스트 입력 후 `AI 분석` 실행
3. 처리 중
   - 입력창/버튼 비활성화
   - 로딩 문구/스피너 표시
4. 완료 시
   - 응답을 수기 등록 모달(`FoodSearchModal`) prefill로 전달
   - 음식명/중량 사이 `AI 답변 요약` 박스 노출

## 3) API Design
- Endpoint: `POST /api/analyze/text`
- Request:
```json
{
  "text": "빅맥 세트 먹었어, 감자튀김은 50% 남겼어"
}
```
- Response:
```json
{
  "menu_name": "빅맥 세트",
  "food_name": "빅맥 세트",
  "amount": 420,
  "amount_basis": "food_serving_estimate",
  "calories": 820,
  "carbs": 92,
  "protein": 26,
  "fat": 38,
  "sugar": 9,
  "sodium": 980,
  "intake_summary": "빅맥세트 섭취, 감자튀김은 50%만 섭취"
}
```

## 4) Data Contract
- `TextAnalysisPrefill`:
  - `food_name`
  - `ai_summary`
  - `amount`
  - `calories/carbs/protein/fat/sugar/sodium`
- `FoodSearchModal.initialPrefill`에 `ai_summary` 전달
- 저장 API(`/api/sheets/records`)에는 `ai_summary` 미전송(UI 전용)

## 5) Error/Edge Handling
- 빈 입력: 전송 차단 + 에러 문구
- AI 파싱 실패: 서버 500 + 클라이언트 에러 표시
- 숫자 이상값: `normalizeAnalyzePayload`로 안전 정규화
- 요약 미반환: 사용자 원문으로 fallback

## 6) Verification Plan
- 시나리오 1: AI 등록 성공 후 수기 모달 prefill 확인
- 시나리오 2: 처리 중 입력 잠금/중복 클릭 차단 확인
- 시나리오 3: 긴 문장 입력 시 요약 박스 표시 확인
- 시나리오 4: 서버 에러 시 에러 배너 노출 확인
