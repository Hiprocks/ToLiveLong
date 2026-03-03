# PDCA Plan - my-info-detail-upgrade

- Feature: `my-info-detail-upgrade`
- Date: `2026-03-03`
- Current Phase: `Plan`
- Level: `Dynamic`

## 1) Goal
- 내정보 페이지의 `목표 수치(AI)`를 요약형에서 상세 항목형으로 개선한다.
- AI 피드백을 사용자 입력 기반의 실행 가능한 코칭 문구(약 200자)로 개선한다.

## 2) Scope
### In Scope
- `목표 수치(AI)` 카드에서 BMR, TDEE, 목표 칼로리, 탄/단/지를 각각 분리된 칸으로 표시
- 필요 지표(당류, 나트륨)도 개별 항목으로 노출
- `권장 매크로(탄/단/지)` 요약 라인 추가
- AI 피드백 생성 프롬프트 강화:
  - 체형/목표 해석
  - 운동 강도/시간/주당 횟수 권장
  - 단백질 위주, 지방 최소화 식단 권장
  - BMR/TDEE/목표 칼로리/탄단지 포함
  - 200자 내 요약
- fallback 피드백도 동일 포맷으로 보강

### Out of Scope
- 시트 스키마 변경
- AI 모델/벤더 변경
- 내정보 외 페이지 구조 변경

## 3) Functional Requirements
| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-01 | 목표 수치 카드에 BMR/TDEE/목표칼로리/탄수/단백질/지방을 개별 칸으로 표시한다. | High | Pending |
| FR-02 | 권장 매크로(탄/단/지) 요약을 별도 라인으로 표시한다. | Medium | Pending |
| FR-03 | AI 피드백은 사용자 입력 기반의 운동/식단 권장 문구를 약 200자로 표시한다. | High | Pending |
| FR-04 | AI 실패 시 fallback 피드백도 동일 품질의 핵심 정보를 포함한다. | High | Pending |

## 4) Non-Functional Requirements
| Category | Criteria | Verification |
|---|---|---|
| Usability | 목표 수치와 피드백이 한 화면에서 즉시 해석 가능해야 한다. | 모바일/데스크톱 수동 확인 |
| Consistency | AI/fallback 모두 유사한 정보 구조를 가진다. | refreshAi=1 포함 수동 점검 |
| Stability | 기존 API 계약과 저장 흐름을 유지한다. | `npm run lint` |

## 5) Risks and Mitigation
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| 피드백 문구가 200자를 초과 | Medium | Medium | normalize 단계의 200자 절단 유지 |
| 입력 미존재로 체형 해석 품질 저하 | Low | Medium | bodyFatPct/waistHipRatio 기반 힌트 + 기본 문구 제공 |
| UI 항목 증가로 카드 밀도 상승 | Medium | Low | 그리드 컬럼 확장(`md:grid-cols-3`)으로 가독성 보완 |

## 6) Definition of Done
- [ ] 내정보에서 목표 수치가 항목별 칸으로 분리 표시된다.
- [ ] 권장 매크로 요약이 추가된다.
- [ ] AI 피드백이 체형/운동/식단/BMR-TDEE-목표/탄단지를 포함한다.
- [ ] 200자 제한이 유지된다.
- [ ] `npm run lint` 통과.

## 7) Next Phase
- Next: `Design`
- Command suggestion: `$pdca design my-info-detail-upgrade`
