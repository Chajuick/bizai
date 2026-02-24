# API 비용 분석

> 기준일: 2026-02-24
> 가정: 사용자 1인당 일 5건 업무 처리, 월 22 영업일 = **월 110건**

## 사용 중인 유료 API

모든 외부 API는 **Manus Forge 프록시(`forge.manus.im`)** 를 통해 호출됨.
환경 변수: `BUILT_IN_FORGE_API_URL`, `BUILT_IN_FORGE_API_KEY`

---

## 1. LLM — Gemini 2.5 Flash -> resolve 모델로 변경해서 테스트 중

**트리거**: 영업일지 작성 시 "저장 + AI 분석" 버튼
**파일**: `server/_core/llm.ts` → `server/routers/salesLogs.ts` (`analyze` 프로시저)

| 항목 | 수치 |
|------|------|
| 호출 횟수 | 110회/월 |
| 입력 토큰/회 | 시스템 프롬프트 ~200 + 일지 본문 ~400 = **600 tokens** |
| 출력 토큰/회 | JSON 결과 ~300 + thinking(budget 128) = **~430 tokens** |
| 월 입력 토큰 | 110 × 600 = **66,000 tokens** |
| 월 출력 토큰 | 110 × 430 = **47,300 tokens** |
| 단가 | 입력 $0.30/1M · 출력 $2.50/1M |
| **월 요금** | $0.02 + $0.12 = **≈ $0.14** |

> `thinking: { budget_tokens: 128 }` 으로 설정되어 있어 thinking 비용은 미미함.

---

## 2. Whisper STT — 음성 전사

**트리거**: 영업일지 작성 시 음성 녹음 버튼 (선택적 사용)
**파일**: `server/_core/voiceTranscription.ts` → `server/routers/salesLogs.ts` (`transcribe` 프로시저)
**가정**: 5건 중 2건이 음성 녹음 사용

| 항목 | 수치 |
|------|------|
| 녹음 횟수 | 2회/일 × 22일 = **44회/월** |
| 평균 녹음 시간 | 2분 |
| 월 총 분수 | **88분** |
| 단가 | $0.006/분 (Whisper-1 기준) |
| **월 요금** | 88 × $0.006 = **≈ $0.53** |

---

## 3. 파일 스토리지

**트리거**: 음성 파일 업로드(`/api/upload-audio`), 첨부파일 업로드(`upload.confirmUpload`)
**파일**: `server/storage.ts` (Forge 프록시 스토리지 사용)

| 항목 | 수치 |
|------|------|
| 음성 파일 | 44회 × 1MB = 44MB |
| 기타 첨부 | ~20MB |
| 월 총 저장 | ~65MB |
| 단가 참고 (AWS S3) | $0.023/GB/월 |
| **월 요금** | **≈ $0.002 (사실상 무료)** |

---

## 4. Google Maps

**현재 상태**: `Map.tsx` 컴포넌트는 존재하나 실제 페이지 미연결 (미사용)

| **월 요금** | **$0** |
|-------------|--------|

---

## 5. 이미지 생성 (삭제됨)

2026-02-24 삭제. `server/_core/imageGeneration.ts` 제거.
실제 어디서도 호출되지 않던 boilerplate 코드였음.

---

## 월 비용 합산

| API | 월 요금 (1인) | 원화 (환율 1,450원) |
|-----|-------------|-------------------|
| LLM (Gemini 2.5 Flash) | $0.14 | ~203원 |
| Whisper STT | $0.53 | ~769원 |
| 파일 스토리지 | $0.002 | ~3원 |
| Google Maps | $0 | $0 |
| **합계** | **$0.67** | **≈ 975원** |

### 시나리오별 비교

| 시나리오 | 월 비용 |
|----------|--------|
| 음성 거의 미사용 (20%) | ~$0.20 |
| 평균 사용 (40%, 기본 가정) | ~$0.67 |
| 음성 헤비 유저 (80%) | ~$1.20 |
| 10인 팀 (평균) | ~$6.70 |
| 50인 조직 (평균) | ~$33.50 |

---

## 비용 절감 포인트

1. **LLM**: Context Caching 활용 시 최대 90% 절감 (시스템 프롬프트 캐싱)
2. **Whisper**: 음성 미사용 시 비용 $0 — 선택 사항이므로 영향 낮음
3. **Google Maps**: 현재 미사용. 기능 추가 시 월 $200 무료 크레딧(10,000건) 내 처리 가능

---

## 참고 링크

- [Gemini API Pricing](https://ai.google.dev/gemini-api/docs/pricing)
- [OpenAI Whisper Pricing](https://openai.com/api/pricing/)
- [Google Maps Platform Pricing](https://developers.google.com/maps/billing-and-pricing/pricing)
