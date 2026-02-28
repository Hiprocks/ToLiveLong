# PDCA 계획서 - photo-analysis-manual-handoff

- 기능명: `photo-analysis-manual-handoff`
- 목표:
  - 사진 등록 시 AI 분석 실패를 줄이고, 실패 원인을 노출한다.
  - 사진 분석 성공 시 바로 저장하지 않고 수기 입력 팝업으로 전환해 사용자가 검토/수정 후 저장하게 한다.

## 요구사항
- FR-1: `/api/analyze`가 최신 Gemini 모델 후보를 순차 시도한다.
- FR-2: 이미지 타입 검증 실패 시 명확한 에러를 반환한다.
- FR-3: 분석 결과 이름이 비어 있으면 기본 이름(`추정 식품`)을 사용한다.
- FR-4: 사진 분석 성공 시 수기 입력 팝업이 열리고 영양성분이 자동 입력된다.
- FR-5: 사용자는 자동 입력값을 수정 후 저장할 수 있다.

## 범위
- `src/app/api/analyze/route.ts`
- `src/lib/analyzePayload.ts`
- `src/components/PhotoAnalysisModal.tsx`
- `src/components/FoodSearchModal.tsx`
- `src/app/page.tsx`