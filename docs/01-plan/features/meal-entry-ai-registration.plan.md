# PDCA Plan - meal-entry-ai-registration

- Feature: `meal-entry-ai-registration`
- Date: `2026-03-04`
- Roles: `PM / FE / BE / QA`
- Phase: `Plan`

## 1) Goal
- 대시보드 `+` 진입 동선에 `AI 등록` 기능을 추가해, 사용자의 자연어 식사 입력으로 식단 등록 초안을 자동 생성한다.
- AI 처리 중 사용자 경험(진행 상태, 입력 잠금)을 명확히 제공하고, 결과를 기존 식단 등록 모달로 안전하게 연결한다.
- AI 응답은 구조화된 영양성분 + 사용자 입력 요약을 포함해, 사용자가 최종 저장 전에 검토할 수 있게 한다.

## 2) Scope
### In Scope
- `+` 메뉴에 `AI 등록` 버튼 추가 (순서: 템플릿 등록 바로 아래, 2번째)
- `AI 등록` 선택 시 텍스트 입력 모달 제공
- 입력창 상단 설명 문구 제공
  - 예시: `빅맥 세트 먹었어, 감자튀김은 50% 남겼어`
- 사용자 텍스트를 API로 전송해 AI 응답 수신
- AI 처리 중 프로그레스 표시 및 입력/전송 버튼 비활성화
- AI 응답(음식명, 구조화 영양성분, 사용자입력 요약)을 수기 등록 모달에 prefill
- 식단 등록 모달에서 음식명과 중량 사이에 `AI 답변 요약` 텍스트 박스 표시

### Out of Scope
- OCR/이미지 분석 모델 변경
- 식품 DB 스키마 변경
- 대시보드 기록 카드 디자인 대규모 개편

## 3) Functional Requirements
| ID | Requirement | Priority | Status |
|---|---|---|---|
| FR-01 | `+` 메뉴에 `AI 등록` 버튼을 2번째 위치로 추가한다. | High | Pending |
| FR-02 | `AI 등록` 모달에 멀티라인 텍스트 입력과 예시 설명을 제공한다. | High | Pending |
| FR-03 | 전송 시 `/api/analyze` 계열 API로 자연어 입력을 전달하고, AI 응답을 JSON 구조로 파싱한다. | High | Pending |
| FR-04 | AI 처리 중 로딩 상태(스피너/문구)와 입력 잠금(`readonly`/`disabled`)을 보장한다. | High | Pending |
| FR-05 | AI 응답에 `food_name`, `amount`, `calories/carbs/protein/fat/sugar/sodium`, `intake_summary`를 포함한다. | High | Pending |
| FR-06 | 수기 등록 모달 prefill 시 기존 수동 수정 흐름을 유지한다(사용자 최종 수정 가능). | High | Pending |
| FR-07 | 등록 모달 내 음식명-중량 사이에 `AI 답변 요약` 박스를 추가해 사용자 입력 요약을 노출한다. | Medium | Pending |

## 4) Non-Functional Requirements
| Category | Criteria | Verification |
|---|---|---|
| Responsiveness | AI 처리 상태가 즉시 시각적으로 반영된다. | 수동 테스트(연속 클릭/중복 전송 방지) |
| Reliability | AI 응답 파싱 실패 시 사용자에게 오류 메시지와 재시도 경로를 제공한다. | 실패 응답 모킹 테스트 |
| Safety | AI 응답 수치가 비정상일 때 기존 안전 정규화 로직을 적용한다. | 경계값 테스트 |
| Usability | 사용자가 입력 요약을 보고 저장 전 검증할 수 있어야 한다. | QA 시나리오 점검 |

## 5) Risks and Mitigation
| Risk | Impact | Likelihood | Mitigation |
|---|---|---|---|
| AI 응답 포맷 불안정으로 파싱 실패 | High | Medium | 스키마 검증 + fallback 메시지 + 재시도 버튼 |
| 로딩 중 중복 요청 발생 | Medium | Medium | 전송 버튼 비활성화 + 요청 중 state lock |
| 요약 문구가 과도하게 길어 UI 깨짐 | Medium | Low | 길이 제한/줄바꿈 처리 및 ellipsis 정책 |

## 6) Definition of Done
- [ ] `+` 메뉴 2번째에 `AI 등록` 버튼이 노출된다.
- [ ] `AI 등록` 텍스트 모달과 예시 문구가 동작한다.
- [ ] AI 처리 중 프로그레스 표시 및 입력 잠금이 적용된다.
- [ ] AI 응답이 수기 등록 모달로 prefill 된다.
- [ ] 등록 모달에 `AI 답변 요약` 박스가 음식명-중량 사이에 표시된다.
- [ ] 실패/재시도 시나리오를 포함한 수동 QA를 통과한다.

## 7) Next Phase
- Next: `Design`
- Command suggestion: `$pdca design meal-entry-ai-registration`
