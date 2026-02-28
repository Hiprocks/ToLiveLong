# PDCA Do Log - photo-analysis-manual-handoff

## 구현 사항
- `/api/analyze` 개선
  - 모델 후보 최신화
  - MIME 검증 추가
  - JSON 응답 강제 설정
- 분석 payload 보정
  - 이름 fallback: `추정 식품`
- 사진 모달 리팩터링
  - 성공 시 즉시 `onAnalyzed` 콜백 전달
  - 저장 UI 제거(수기 입력 모달로 이관)
- 수기 모달 연동
  - `initialPrefill` 지원
  - 열릴 때 manual 모드 + prefill 자동 주입
- 홈 화면 orchestration
  - 사진 분석 성공 → 수기 입력 모달 자동 오픈