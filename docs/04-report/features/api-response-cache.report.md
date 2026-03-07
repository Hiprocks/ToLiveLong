# Report: api-response-cache

## 1. 완료 항목

| 항목 | 결과 |
|------|------|
| records GET 서버 캐시 (TTL 30s) | 완료 |
| templates GET 서버 캐시 (TTL 300s) | 완료 |
| user GET 서버 캐시 (TTL 300s, refreshAi bypass) | 완료 |
| 모든 쓰기 API revalidateTag 적용 | 완료 |
| 빌드 통과 (TS + 테스트 13/13) | 완료 |
| Vercel 프로덕션 배포 | 완료 |

## 2. 품질 지표

- 빌드 성공률: 100% (1차 타입 오류 → 수정 후 통과)
- 단위 테스트: 13/13 PASS (기존 테스트 회귀 없음)
- 신규 파일: `src/lib/sheetsCache.ts` (80 lines)
- 변경 파일: 4개 API 라우트 (각 import 교체 + revalidateCacheTag 호출)

## 3. 기술적 발견

### Next.js 16 `revalidateTag` 시그니처 변경
- **현상**: `revalidateTag(tag)` → `revalidateTag(tag, profile)` 로 TypeScript 타입 변경
- **원인**: Next.js 16의 새 `use cache` 디렉티브 도입으로 profile 인자 추가
- **대응**: `revalidateCacheTag` 래퍼로 캐스팅 격리, 런타임 동작 정상 확인
- **영향**: `sheetsCache.ts` 1곳에서만 관리, 라우트 파일 독립성 유지

## 4. 성능 개선 기대 효과

| 시나리오 | 이전 | 이후 (캐시 히트) |
|---------|------|----------------|
| 대시보드 재방문 (30초 이내) | Sheets API ~800ms | 캐시 ~10ms |
| 즐겨찾기 탭 재오픈 (5분 이내) | Sheets API ~800ms | 캐시 ~10ms |
| 내정보 페이지 재방문 (5분 이내) | Sheets API ~800ms | 캐시 ~10ms |
| 식단 등록 후 대시보드 갱신 | Sheets API ~800ms | revalidate 후 1회 Sheets, 이후 캐시 |

## 5. 교훈

- `unstable_cache` + `revalidateTag` 패턴은 Google Sheets처럼 외부 BaaS를 사용하는 Next.js 앱에 적합
- 쓰기 시 태그 단위 무효화는 경로 단위(`revalidatePath`)보다 세밀하게 캐시 제어 가능
- Next.js 메이저 업그레이드 시 `next/cache` API 타입 변경 여부를 빌드에서 조기 감지 가능

## 6. 다음 이터레이션 후보

- `unstable_cache` → `use cache` 디렉티브 마이그레이션 (Next.js 16 안정화 후)
- 클라이언트 캐시 TTL 조정 (서버 캐시 도입으로 중요도 낮아짐)
