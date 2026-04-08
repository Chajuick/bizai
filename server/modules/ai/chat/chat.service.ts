// server/modules/ai/chat/chat.service.ts

import type { ServiceCtx } from "../../../core/serviceCtx";
import { invokeLLM, type Tool, type Message } from "../../../core/llm";
import { getDb } from "../../../core/db";
import { aiService } from "../ai.service";

import { saleService } from "../../crm/sale/sale.service";
import { expenseService } from "../../crm/expense/expense.service";
import { scheduleService } from "../../crm/schedule/schedule.service";
import { dashboardService } from "../../crm/dashboard/dashboard.service";

import type { ChatMessageType } from "./chat.dto";

// #region Tool definitions

const TOOLS: Tool[] = [
  {
    type: "function",
    function: {
      name: "get_stats",
      description: "이번 달 영업 현황 통계를 조회합니다. 매출, 지출, 일지 수, 일정 수 등 전반적인 현황을 파악할 때 사용하세요.",
      parameters: { type: "object", properties: {}, required: [] },
    },
  },
  {
    type: "function",
    function: {
      name: "list_sales",
      description: "최근 영업일지 목록을 조회합니다. 거래처명이나 키워드로 검색할 수 있습니다. 결과가 없으면 검색어를 더 짧게 줄여서 재시도하세요 (예: '코리아 패키징' → '코리아').",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "검색 키워드 (거래처명, 내용 등)" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_expenses",
      description: "지출 내역을 조회합니다. 기간별, 카테고리별 지출 파악에 사용하세요.",
      parameters: {
        type: "object",
        properties: {
          search: { type: "string", description: "검색 키워드" },
        },
        required: [],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_schedules",
      description: "일정 목록을 조회합니다. 다가오는 일정이나 미처리 일정을 확인할 때 사용하세요.",
      parameters: {
        type: "object",
        properties: {
          tab: {
            type: "string",
            enum: ["all", "scheduled", "overdue", "imminent", "completed", "canceled"],
            description: "all: 전체, scheduled: 예정, overdue: 지난, imminent: 임박(48시간 내), completed: 완료, canceled: 취소",
          },
        },
        required: [],
      },
    },
  },
];

// #endregion

// #region Tool executor helpers

function fmtDate(d: Date | string | null | undefined): string | null {
  if (!d) return null;
  const date = d instanceof Date ? d : new Date(d);
  if (isNaN(date.getTime())) return null;
  return date.toLocaleDateString("ko-KR", { timeZone: "Asia/Seoul", year: "numeric", month: "2-digit", day: "2-digit" }).replace(/\. /g, "-").replace(".", "");
}

function truncate(s: string | null | undefined, max = 120): string | null {
  if (!s) return null;
  return s.length > max ? s.slice(0, max) + "…" : s;
}

// #endregion

// #region Tool executor

async function executeTool(
  ctx: ServiceCtx,
  name: string,
  args: Record<string, unknown>
): Promise<string> {
  if (name === "get_stats") {
    const stats = await dashboardService.getStats(ctx);
    // 배열 제외 — 상세 조회는 list_sales/list_schedules 사용
    return JSON.stringify({
      이번달_일지수: stats.logsThisMonth,
      이번달_매출: stats.monthlyRevenue,
      예정_일정수: stats.upcomingSchedulesCount,
      지연_일정수: stats.overdueCount,
      임박_일정수: stats.imminentCount,
      수주_미결제: stats.totalInvoiced,
    });
  }

  if (name === "list_sales") {
    const result = await saleService.listSales(ctx, {
      search: args.search as string | undefined,
      page: { limit: 5, offset: 0 },
      sort: { field: "vist_date", dir: "desc" },
    });
    return JSON.stringify(
      result.items.map(s => ({
        거래처: s.clie_name,
        방문일: fmtDate(s.vist_date),
        매출: s.sale_pric,
        요약: truncate(s.aiex_summ),
      }))
    );
  }

  if (name === "list_expenses") {
    const result = await expenseService.listExpenses(ctx, {
      search: args.search as string | undefined,
      page: { limit: 5, offset: 0 },
    });
    return JSON.stringify(
      result.items.map(e => ({
        항목: e.expe_name,
        날짜: fmtDate(e.expe_date),
        금액: e.expe_amnt,
        카테고리: e.ai_categ,
      }))
    );
  }

  if (name === "list_schedules") {
    const tab = (args.tab as "all" | "scheduled" | "overdue" | "imminent" | "completed" | "canceled") ?? "scheduled";
    const result = await scheduleService.listSchedules(ctx, {
      tab,
      page: { limit: 5, offset: 0 },
    });
    return JSON.stringify(
      result.items.map(s => ({
        일정명: s.sche_name,
        일시: fmtDate(s.sche_date),
        거래처: s.clie_name,
      }))
    );
  }

  return JSON.stringify({ error: `Unknown tool: ${name}` });
}

// #endregion

// #region System prompt

function buildSystemPrompt(_ctx: ServiceCtx): string {
  const now = new Date().toLocaleDateString("ko-KR", {
    timeZone: "Asia/Seoul",
    year: "numeric",
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  return `영업관리 앱 AI 어시스턴트. 오늘: ${now}
- tool로 데이터 조회 후 답변. 데이터 없으면 솔직히 말할 것
- 추측·할루시네이션 금지. 조회 전용 (수정·삭제 불가)
- 한국어, 간결하게`;
}

// #endregion

// #region Service

export const chatService = {
  async send(ctx: ServiceCtx, messages: ChatMessageType[]): Promise<string> {
    const systemPrompt = buildSystemPrompt(ctx);

    // 대화 히스토리 최근 6개만 (토큰 절약)
    const recentMessages = messages.slice(-6);

    const llmMessages: Message[] = [
      { role: "system", content: systemPrompt },
      ...recentMessages.map(m => ({ role: m.role as "user" | "assistant", content: m.content })),
    ];

    // tool use 루프 (최대 5회 반복)
    let totalInpt = 0;
    let totalOuts = 0;
    let lastModel = "";

    const recordChat = async (reply: string) => {
      try {
        await aiService.recordUsage(getDb(), {
          comp_idno: ctx.comp_idno,
          user_idno: ctx.user_idno,
          feat_code: "chat",
          mode_name: lastModel,
          tokn_inpt: totalInpt,
          tokn_outs: totalOuts,
          meta_json: { turns: messages.length },
        });
      } catch {
        // 사용량 기록 실패는 무시 (응답은 정상 반환)
      }
      return reply;
    };

    for (let i = 0; i < 5; i++) {
      let result;
      try {
        result = await invokeLLM({
          messages: llmMessages,
          tools: TOOLS,
          toolChoice: "auto",
          maxTokens: 1024,
        });
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes("rate_limit") || msg.includes("429") || msg.includes("TPM") || msg.includes("tokens per")) {
          return "요청이 너무 많습니다. 잠시 후 다시 시도해주세요.";
        }
        return `AI 오류가 발생했습니다: ${msg}`;
      }

      // 토큰 누적
      totalInpt += result.usage?.prompt_tokens ?? 0;
      totalOuts += result.usage?.completion_tokens ?? 0;
      if (result.model) lastModel = result.model;

      const choice = result.choices[0];
      if (!choice) break;

      const { message } = choice;

      // tool_calls가 없으면 최종 응답
      if (!message.tool_calls || message.tool_calls.length === 0) {
        const content = typeof message.content === "string"
          ? message.content
          : Array.isArray(message.content)
            ? message.content.map(p => (p.type === "text" ? p.text : "")).join("")
            : "";
        return recordChat(content || "죄송합니다, 답변을 생성하지 못했습니다.");
      }

      // assistant 메시지 (tool_calls 포함) 추가 — content는 Groq 스펙상 null 허용
      llmMessages.push({
        role: "assistant",
        content: message.content ?? null,
        tool_calls: message.tool_calls,
      });

      // 각 tool 실행 후 결과 추가
      for (const tc of message.tool_calls) {
        let args: Record<string, unknown> = {};
        try {
          args = JSON.parse(tc.function.arguments) as Record<string, unknown>;
        } catch {
          // 빈 args
        }

        const toolResult = await executeTool(ctx, tc.function.name, args);

        llmMessages.push({
          role: "tool",
          tool_call_id: tc.id,
          content: toolResult,
        });
      }
    }

    return recordChat("죄송합니다, 일시적인 오류가 발생했습니다.");
  },
};

// #endregion
