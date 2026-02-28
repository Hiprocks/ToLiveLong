# PDCA 계획서 - ui-text-koreanization-cleanup

- 기능명: `ui-text-koreanization-cleanup`
- 작성일: `2026-02-27`
- 현재 단계: Plan

## 1) 목표
- 사용자에게 노출되는 모든 메뉴명, 탭명, 주요 액션 라벨을 한국어로 정리한다.
- 기존 UI에서 남아있는 영어 라벨을 같은 변경 세트에서 한국어로 교체한다.
- 정책 위반을 재발하지 않도록 점검 기준을 만든다.

## 2) 범위
### 포함 범위 (In Scope)
- `src/app/page.tsx`, `src/app/history/page.tsx`, `src/app/my/page.tsx`의 사용자 노출 텍스트
- 모달/컴포넌트(`src/components/*`)의 버튼, 탭, 안내 문구
- 공통 에러/알림 UI 문구(`src/components/ErrorBanner.tsx` 등)

### 제외 범위 (Out of Scope)
- API 응답/로그/디버그 메시지
- 데이터 스키마 및 비즈니스 로직 변경

## 3) 완료 기준 (Definition of Done)
- 주요 화면에서 영어 라벨이 남아있지 않음
- 신규/기존 한국어 라벨이 정책(2026-02-26/27) 준수
- QA 체크리스트 작성 및 1회 확인
- `npm run lint`, `npm run build` 통과

## 4) 다음 단계
- 다음 단계: Design
- 실행 명령: `$pdca design ui-text-koreanization-cleanup`
