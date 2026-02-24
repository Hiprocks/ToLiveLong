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

## API 매핑
- `GET /api/sheets/records`: 날짜 기준 조회
- `POST /api/sheets/records`: 기록 추가
- `PUT /api/sheets/records/[id]`: 기록 수정
- `DELETE /api/sheets/records/[id]`: 기록 삭제
- `GET /api/sheets/templates`: 템플릿 조회
- `POST /api/sheets/templates`: 템플릿 추가
- `GET /api/sheets/user`: 목표값 조회
- `PUT /api/sheets/user`: 목표값 수정
