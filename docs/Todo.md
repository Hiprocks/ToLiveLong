# Todo

## P0
- [x] Google Sheets API Routes 구현 (`records`, `templates`, `user`)
- [x] 대시보드 Sheets 연동
- [x] 히스토리 조회/수정/삭제 구현
- [x] 내 정보(목표값) 조회/수정 구현
- [x] 식단 입력(수기/템플릿/사진분석) Sheets 저장 연동

## P1
- [ ] Supabase 완전 제거
  - [ ] `src/lib/supabase.ts` 삭제
  - [ ] `src/components/AddMealModal.tsx` 삭제
  - [ ] `supabase_schema.sql` 정리 또는 제거
  - [ ] `@supabase/supabase-js` 의존성 제거
  - [ ] `.env.local`의 Supabase 변수 제거
- [ ] UI 텍스트/인코딩 정리
- [ ] 템플릿 UX 개선 (검색/선택/즐겨찾기 정책 확정)

## P2
- [ ] 에러 상태 UX 정리 (API 실패 메시지 일관화)
- [ ] 간단한 수동 테스트 시나리오 문서화
- [ ] README 실행 가이드 최신화

## 운영 규칙
- 작업 완료 시 체크박스 업데이트
- 실패/회귀 발생 시 `docs/MistakeNote.md` 기록
