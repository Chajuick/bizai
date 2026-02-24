import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  getSalesLogs,
  getSalesLogById,
  createSalesLog,
  updateSalesLog,
  deleteSalesLog,
  createPromise,
  getAttachmentsBySalesLog,
  findBestClientMatch,
  findOrCreateClient,
  createClient,
} from "../db";
import { invokeLLM } from "../_core/llm";
import { transcribeAudio } from "../_core/voiceTranscription";
import { notifyOwner } from "../_core/notification";

// AI 영업일지 구조화 분석
async function analyzeWithAI(text: string) {
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  try {
    const response = await invokeLLM({
      messages: [
        {
          role: "system",
          content: `당신은 한국어 영업일지를 분석하는 AI입니다. 영업 담당자가 작성한 텍스트에서 핵심 정보를 추출하세요.
오늘 날짜: ${today}
"6개월 후", "다음 주" 같은 상대적 표현은 오늘 날짜를 기준으로 계산하세요.
날짜를 특정할 수 없는 경우 scheduledAt을 null로 설정하세요.
반드시 다음 JSON 형식으로만 응답하세요:
{
  "clientName": "고객사명 (없으면 null)",
  "contactPerson": "담당자명 (없으면 null)",
  "amount": "금액 숫자 (없으면 null, 단위 제거)",
  "nextActions": ["다음 액션 1", "다음 액션 2"],
  "promises": [{"title": "일정 내용", "scheduledAt": "ISO 날짜 (없으면 null)", "amount": "금액 숫자 (없으면 null)", "description": "메모/맥락 (없으면 null)"}],
  "summary": "2-3문장 요약",
  "keywords": ["키워드1", "키워드2"],
  "sentiment": "positive|neutral|negative"
}`,
        },
        { role: "user", content: text },
      ],
      response_format: {
        type: "json_schema",
        json_schema: {
          name: "sales_analysis",
          strict: true,
          schema: {
            type: "object",
            properties: {
              clientName: { type: ["string", "null"] },
              contactPerson: { type: ["string", "null"] },
              amount: { type: ["number", "null"] },
              nextActions: { type: "array", items: { type: "string" } },
              promises: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    title: { type: "string" },
                    scheduledAt: { type: ["string", "null"] },
                    amount: { type: ["number", "null"] },
                    description: { type: ["string", "null"] },
                  },
                  required: ["title", "scheduledAt", "amount", "description"],
                  additionalProperties: false,
                },
              },
              summary: { type: "string" },
              keywords: { type: "array", items: { type: "string" } },
              sentiment: { type: "string" },
            },
            required: ["clientName", "contactPerson", "amount", "nextActions", "promises", "summary", "keywords", "sentiment"],
            additionalProperties: false,
          },
        },
      },
    });

    const content = response.choices[0]?.message?.content;
    if (!content) return null;
    const contentStr = typeof content === 'string' ? content : JSON.stringify(content);
    return JSON.parse(contentStr);
  } catch (e) {
    console.error("[AI] Analysis failed:", e);
    return null;
  }
}

export const salesLogsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        clientId: z.number().optional(),
        search: z.string().optional(),
        limit: z.number().default(20),
        offset: z.number().default(0),
      }).optional()
    )
    .query(({ ctx, input }) =>
      getSalesLogs(ctx.user.id, {
        clientId: input?.clientId,
        search: input?.search,
        limit: input?.limit,
        offset: input?.offset,
      })
    ),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const log = await getSalesLogById(input.id, ctx.user.id);
      if (!log) return null;
      const attachmentsList = await getAttachmentsBySalesLog(input.id, ctx.user.id);
      return { ...log, attachments: attachmentsList };
    }),

  create: protectedProcedure
    .input(
      z.object({
        clientId: z.number().optional(),
        clientName: z.string().optional(),
        contactPerson: z.string().optional(),
        location: z.string().optional(),
        visitedAt: z.string(),
        rawContent: z.string().min(1),
        audioUrl: z.string().optional(),
        transcribedText: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      let clientId = input.clientId;
      let clientName = input.clientName;

      // clientName 있고 clientId 없으면 → 신규 고객사 등록 (매칭은 프론트에서 확인 후 처리)
      if (clientName && !clientId) {
        const newClient = await createClient({ userId: ctx.user.id, name: clientName });
        clientId = (newClient as any).insertId;
      }

      const result = await createSalesLog({
        ...input,
        clientId,
        clientName,
        userId: ctx.user.id,
        visitedAt: new Date(input.visitedAt),
        isProcessed: false,
      });
      return { id: result.insertId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clientId: z.number().nullable().optional(), // null = clientId 초기화
        clientName: z.string().optional(),
        contactPerson: z.string().optional(),
        location: z.string().optional(),
        visitedAt: z.string().optional(),
        rawContent: z.string().optional(),
      })
    )
    .mutation(({ ctx, input }) => {
      const { id, visitedAt, ...rest } = input;
      return updateSalesLog(id, ctx.user.id, {
        ...rest,
        ...(visitedAt ? { visitedAt: new Date(visitedAt) } : {}),
      });
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(({ ctx, input }) => deleteSalesLog(input.id, ctx.user.id)),

  // AI 분석 + 일정 자동 생성
  analyze: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const log = await getSalesLogById(input.id, ctx.user.id);
      if (!log) throw new Error("영업일지를 찾을 수 없습니다.");

      const textToAnalyze = log.transcribedText || log.rawContent;
      const analysis = await analyzeWithAI(textToAnalyze);

      if (!analysis) throw new Error("AI 분석에 실패했습니다.");

      // AI가 추출한 clientName으로 기존 고객사 자동 연결 (또는 신규 등록)
      let resolvedClientId = log.clientId ?? undefined;
      let resolvedClientName: string | undefined = undefined;
      if (analysis.clientName && !log.clientId) {
        const match = await findBestClientMatch(ctx.user.id, analysis.clientName);
        if (match) {
          resolvedClientId = match.id;
          resolvedClientName = match.name; // 정규 고객사명 (예: "주나산" → "나산")
        } else {
          // 매칭 없음 → 신규 고객사로 자동 등록
          const newClient = await findOrCreateClient(ctx.user.id, analysis.clientName);
          resolvedClientId = newClient.id;
          resolvedClientName = newClient.name;
        }
      }

      // 영업일지 업데이트
      await updateSalesLog(input.id, ctx.user.id, {
        aiSummary: analysis.summary,
        aiExtracted: analysis,
        isProcessed: true,
        ...(resolvedClientId ? { clientId: resolvedClientId } : {}),
        // 매칭된 정규 이름 우선, 없으면 AI 추출 이름 (기존 값 없을 때만)
        ...(resolvedClientName
          ? { clientName: resolvedClientName }
          : analysis.clientName && !log.clientName
            ? { clientName: analysis.clientName }
            : {}),
        ...(analysis.contactPerson && !log.contactPerson ? { contactPerson: analysis.contactPerson } : {}),
      });

      // 일정 자동 생성 (날짜가 명확한 경우만)
      const createdPromises = [];
      for (const p of analysis.promises || []) {
        if (p.title && p.scheduledAt) {
          const scheduledAt = new Date(p.scheduledAt);
          if (isNaN(scheduledAt.getTime())) continue;
          const pr = await createPromise({
            userId: ctx.user.id,
            salesLogId: input.id,
            clientId: resolvedClientId,
            clientName: resolvedClientName || analysis.clientName || log.clientName || undefined,
            title: p.title,
            scheduledAt,
            amount: p.amount ? String(p.amount) : undefined,
            description: p.description || undefined,
            isAutoGenerated: true,
          });
          createdPromises.push(pr);
        }
      }

      // 퍼지 매칭으로 연결됐고 원본 이름과 다를 때 → 프론트에서 확인 모달 표시
      const matchSuggestion =
        resolvedClientId && resolvedClientName && analysis.clientName &&
        analysis.clientName.toLowerCase() !== resolvedClientName.toLowerCase()
          ? {
              originalName: analysis.clientName as string,
              matchedId: resolvedClientId,
              matchedName: resolvedClientName,
            }
          : null;

      return { analysis, promisesCreated: createdPromises.length, matchSuggestion };
    }),

  // 음성 파일 변환
  transcribe: protectedProcedure
    .input(z.object({ audioUrl: z.string().url() }))
    .mutation(async ({ ctx, input }) => {
      const result = await transcribeAudio({ audioUrl: input.audioUrl, language: "ko" });
      if ('error' in result) throw new Error(result.error || '음성 변환에 실패했습니다.');
      return { text: result.text, language: result.language };
    }),
});
