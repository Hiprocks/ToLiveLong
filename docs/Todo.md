# Todo

## P0
- [x] Google Sheets API Routes 구현 (`records`, `templates`, `user`)
- [x] 대시보드 Sheets 연동
- [x] 히스토리 조회/수정/삭제 구현
- [x] 내 정보(목표값) 조회/수정 구현
- [x] 식단 입력(수기/템플릿/사진분석) Sheets 저장 연동

## P1
- [x] Supabase 완전 제거
  - [x] `src/lib/supabase.ts` 삭제
  - [x] `src/components/AddMealModal.tsx` 삭제
  - [x] `supabase_schema.sql` 정리 또는 제거
  - [x] `@supabase/supabase-js` 의존성 제거
  - [x] `.env.local`의 Supabase 변수 제거
- [ ] UI 텍스트/인코딩 정리
- [ ] 템플릿 UX 개선 (검색/선택/즐겨찾기 정책 확정)
- [ ] 등록 과정 UX 개선
  - [ ] 수기/템플릿/사진분석 진입 동선 단순화
  - [ ] 저장 전/후 상태(로딩/성공/실패) 일관화
  - [ ] 입력 폼 단계 및 필수값 가이드 개선
- [ ] 등록 UI 개선
  - [ ] 모바일 우선 레이아웃 정리
  - [ ] 컴포넌트 간 시각 일관성 정리
  - [ ] 접근성(라벨, 포커스, 버튼 상태) 보강

## P2
- [x] 에러 상태 UX 정리 (API 실패 메시지 일관화)
- [ ] 간단한 수동 테스트 시나리오 문서화
- [ ] README 실행 가이드 최신화

## 운영 규칙
- 작업 완료 시 체크박스 업데이트
- 실패/회귀 발생 시 `docs/MistakeNote.md` 기록

## 테스트 메모
- [x] Google Sheets 실데이터 저장/로드 스모크 테스트
  - 2026-02-25 기준: `POST /api/sheets/records` -> `GET /api/sheets/records?date=...` -> `PUT /api/sheets/records/[id]` -> `DELETE /api/sheets/records/[id]` 정상 확인
