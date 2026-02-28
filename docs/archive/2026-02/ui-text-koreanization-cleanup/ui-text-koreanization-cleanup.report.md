# PDCA Report - ui-text-koreanization-cleanup

- Feature: `ui-text-koreanization-cleanup`
- Date: `2026-02-27`
- Phase: Report

## Summary
- UI 텍스트 내 영어 약어/라벨을 한국어로 정리함.
- 대상: 식단 테이블, 내정보 계산 결과 카드, 칼로리 게이지.

## Changes
- 식단 테이블 C/P/F → 탄/단/지
- 계산 결과 카드 BMR/TDEE → 기초대사량/활동대사량
- 칼로리 게이지 라벨 Calories → 칼로리

## Validation
- 테스트 미실행(요청에 따라 생략)

## Follow-up
- 필요 시 `npm run lint`, `npm run build` 실행 후 archive 전환
