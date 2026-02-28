# PDCA Report - my-bodycomp-algorithm-upgrade

- Feature: `my-bodycomp-algorithm-upgrade`
- Date: `2026-02-27`
- Phase: Report

## Summary
- My 영역에 린매스업 목표와 매크로 타입(균형/고단백/저탄고지) 반영.
- 체지방률 입력 시 Katch-McArdle 기반 BMR 계산 적용.
- 목표-식단 타입 상충 경고 UX 추가.

## Changes
- 목표 옵션: `recomposition`(린매스업) 추가
- 식단 타입: `keto`(저탄고지) 추가
- 목표 선택지에서 `과지방/비만/고도비만` 제거
- My 프로필의 "영양 비율" 라벨을 "선호 식단"으로 변경
- 목표 칼로리 배수 로직 적용
- 린매스업 단백질 비중 상향 보정
- 경고 메시지 노출
- 체지방률 미입력 시 AI 제안 결과를 우선 적용

## Validation
- 테스트 미실행(요청에 따라 생략)

## Follow-up
- 필요 시 `npm run lint`, `npm run build` 실행
- 상충 규칙 확장(목표/식단 타입 조합별)
