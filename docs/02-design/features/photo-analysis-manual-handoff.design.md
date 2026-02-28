# PDCA 설계서 - photo-analysis-manual-handoff

## UX 흐름
1. 사용자가 사진 분석 모달에서 이미지를 업로드한다.
2. `/api/analyze` 호출 성공 시 `{ food_name, calories, carbs, protein, fat, sugar, sodium }`를 받는다.
3. 홈 페이지가 분석 결과를 받아 수기 입력 모달(`FoodSearchModal`, manual 모드)을 자동 오픈한다.
4. 사용자가 이름/중량/영양값을 확인 후 저장한다.

## 기술 설계
- API 신뢰성
  - 모델 후보: 2.5/2.0/1.5 계열 순차 fallback
  - `responseMimeType=application/json` 사용
  - MIME 검증(`image/*`) 추가
- 데이터 정규화
  - 이름 공란 시 `추정 식품`으로 보정
- 화면 연동
  - `PhotoAnalysisModal.onAnalyzed(prefill)` 콜백 추가
  - `FoodSearchModal.initialPrefill`로 수기 모달 자동 채움
  - 홈에서 `photoPrefill` 상태로 모달 간 handoff