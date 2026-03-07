# Analysis: api-response-cache

## 1. 계획 대비 구현 비교

| 항목 | 계획 | 구현 | 일치 |
|------|------|------|------|
| records GET 캐시 (TTL 30s) | ✅ | `getCachedRecordsByDate` + `getCachedAllRecords` | ✅ |
| templates GET 캐시 (TTL 300s) | ✅ | `getCachedTemplates` | ✅ |
| user GET 캐시 (TTL 300s) | ✅ | `getCachedUserRows` | ✅ |
| refreshAi=1 캐시 bypass | ✅ | `refreshAi ? listRows() : getCachedUserRows()` | ✅ |
| POST/PUT/DELETE revalidateTag | ✅ | 전 라우트 적용 완료 | ✅ |
| templateSaved 시 templates 캐시도 무효화 | 계획에 명시 없음 | records POST에 추가 적용 | ✅ (개선) |
| Upstash 미도입 | Won't Do | 미도입 | ✅ |
| ISR 미도입 | Won't Do | 미도입 | ✅ |

**일치율: 100%** (계획 외 1건 추가 개선 포함)

## 2. 구현 품질 분석

### 아키텍처
- `src/lib/sheetsCache.ts` 단일 파일로 캐시 로직 집중 관리
- 라우트 파일은 import만으로 캐시 적용 → 관심사 분리 달성
- `revalidateCacheTag` 래퍼로 Next.js 16 타입 변경 격리

### 타입 안전성
- Next.js 16에서 `revalidateTag(tag, profile)` 시그니처 변경 발견
- `unstable_cache` 기반 태그 무효화는 런타임에 단일 인자로 동작 확인
- 타입 캐스팅을 래퍼 함수로 격리해 라우트 파일 오염 방지

### 캐시 무효화 정확성
| 작업 | 무효화 태그 |
|------|------------|
| POST /records (즐겨찾기 미포함) | `records` |
| POST /records (즐겨찾기 포함) | `records`, `templates` |
| PUT /records/[id] | `records` |
| DELETE /records/[id] | `records` |
| POST /templates | `templates` |
| PUT /templates | `templates` |
| DELETE /templates | `templates` |
| PUT /user | `user` |

## 3. 수용된 변경사항
- `parseTemplate` import 제거 (`templates/route.ts`에서 직접 참조 불필요 → `sheetsCache.ts`로 이동)
- `parseRecord`, `listRecordDateColumn`, `getRowsByIndexes` import `records/route.ts`에서 제거

## 4. 미해결 / 다음 이터레이션 후보
| 항목 | 우선순위 | 사유 |
|------|---------|------|
| 캐시 히트율 모니터링 | 낮음 | Vercel Analytics로 확인 가능, 별도 구현 불필요 |
| `unstable_cache` → `use cache` 마이그레이션 | 낮음 | Next.js 16에서 안정화되면 고려 |
| 클라이언트 캐시 TTL 단축 | 낮음 | 서버 캐시와 이중 레이어지만 탭 전환 UX 유지 목적으로 현행 유지 |
