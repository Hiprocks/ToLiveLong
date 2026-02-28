# Schema (Google Sheets)

## 시트 구성
- `records`
- `templates`
- `user`

## 1) records
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | string | 기록 고유값 |
| date | string | `YYYY-MM-DD` |
| meal_type | string | `breakfast/lunch/dinner/snack` |
| food_name | string | 음식명 |
| amount | number | 섭취량(g) |
| calories | number | kcal |
| carbs | number | g |
| protein | number | g |
| fat | number | g |
| sugar | number | g |
| sodium | number | mg |

## 2) templates
| 컬럼 | 타입 | 설명 |
|---|---|---|
| id | string | 템플릿 고유값 |
| food_name | string | 음식명 |
| base_amount | number | 기준 섭취량(g) |
| calories | number | 기준 kcal |
| carbs | number | 기준 g |
| protein | number | 기준 g |
| fat | number | 기준 g |
| sugar | number | 기준 g |
| sodium | number | 기준 mg |

## 3) user (단일 행)
| 컬럼 | 타입 | 설명 |
|---|---|---|
| daily_calories | number | 목표 칼로리 |
| carbs | number | 목표 탄수화물(g) |
| protein | number | 목표 단백질(g) |
| fat | number | 목표 지방(g) |
| sugar | number | 목표 당(g) |
| sodium | number | 목표 나트륨(mg) |
| gender | string | `male/female` |
| age | number | 나이 |
| height_cm | number | 키(cm) |
| weight_kg | number | 체중(kg) |
| primary_goal | string | `cutting/maintenance/bulking/recomposition/overfat/obese/severe_obese` |
| macro_preference | string | `balanced/low_carb/high_protein/keto` |
| occupational_activity_level | string | `sedentary/light/moderate/very/extra` |
| exercise_frequency_weekly | number | 주간 운동 빈도 |
| exercise_duration_min | number | 운동 시간(분) |
| exercise_intensity | string | `low/medium/high` |
| neat_level | string | `sedentary/light/moderate/very/extra` |
| body_fat_pct | number | 체지방률(%) |
| skeletal_muscle_kg | number | 골격근량(kg) |
| waist_hip_ratio | number | WHR |
| ai_bmr | number | AI 산출 BMR |
| ai_tdee | number | AI 산출 TDEE |
| ai_target_calories | number | AI 산출 목표 칼로리 |
| ai_notes | string | AI 조언 요약(200자 이내) |
| ai_source | string | `ai/fallback` |
| ai_updated_at | string | ISO timestamp |

## API 매핑
- `GET /api/sheets/records`: 날짜 기준 조회 (날짜 컬럼 우선 조회)
- `POST /api/sheets/records`: 기록 추가 (옵션: 템플릿 저장, 실패 시 롤백)
- `PUT /api/sheets/records/[id]`: 기록 수정 (id 컬럼 기반 대상 행 조회)
- `DELETE /api/sheets/records/[id]`: 기록 삭제 (id 컬럼 기반 대상 행 조회)
- `GET /api/sheets/templates`: 템플릿 조회
- `POST /api/sheets/templates`: 템플릿 추가
- `GET /api/sheets/user`: 목표값 조회
- `PUT /api/sheets/user`: 목표값 수정

## 검증/보안 규칙
- 숫자 필드는 음수 불가, 상한값 검증 적용
- `date`는 `YYYY-MM-DD` 형식 검증
- `meal_type`은 `breakfast/lunch/dinner/snack`만 허용
- 쓰기 요청(POST/PUT/DELETE)은 same-origin 가드 적용

---

## Schema Note (2026-02-25)

- App-level contract no longer uses `meal_type`.
- Legacy sheet column may still exist for backward compatibility, but clients should ignore it.
