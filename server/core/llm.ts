import { ENV } from "./env/env";

export type Role = "system" | "user" | "assistant" | "tool" | "function";

export type TextContent = {
  type: "text";
  text: string;
};

export type ImageContent = {
  type: "image_url";
  image_url: {
    url: string;
    detail?: "auto" | "low" | "high";
  };
};

export type FileContent = {
  type: "file_url";
  file_url: {
    url: string;
    mime_type?: "audio/mpeg" | "audio/wav" | "application/pdf" | "audio/mp4" | "video/mp4";
  };
};

export type MessageContent = string | TextContent | ImageContent | FileContent;

export type Message = {
  role: Role;
  content: MessageContent | MessageContent[] | null;
  name?: string;
  tool_call_id?: string;
  tool_calls?: ToolCall[];
};

export type Tool = {
  type: "function";
  function: {
    name: string;
    description?: string;
    parameters?: Record<string, unknown>;
  };
};

export type ToolChoicePrimitive = "none" | "auto" | "required";
export type ToolChoiceByName = { name: string };
export type ToolChoiceExplicit = {
  type: "function";
  function: {
    name: string;
  };
};

export type ToolChoice =
  | ToolChoicePrimitive
  | ToolChoiceByName
  | ToolChoiceExplicit;

export type InvokeParams = {
  messages: Message[];
  tools?: Tool[];
  toolChoice?: ToolChoice;
  tool_choice?: ToolChoice;
  maxTokens?: number;
  max_tokens?: number;
  temperature?: number;
  top_p?: number;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
};

export type ToolCall = {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
};

export type InvokeResult = {
  id: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: Role;
      content: string | Array<TextContent | ImageContent | FileContent>;
      tool_calls?: ToolCall[];
    };
    finish_reason: string | null;
  }>;
  usage?: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
};

export type JsonSchema = {
  name: string;
  schema: Record<string, unknown>;
  strict?: boolean;
};

export type OutputSchema = JsonSchema;

export type ResponseFormat =
  | { type: "text" }
  | { type: "json_object" }
  | { type: "json_schema"; json_schema: JsonSchema };

// #region Helpers

const ensureArray = (
  value: MessageContent | MessageContent[]
): MessageContent[] => (Array.isArray(value) ? value : [value]);

const normalizeContentPart = (
  part: MessageContent
): TextContent | ImageContent | FileContent => {
  if (typeof part === "string") {
    return { type: "text", text: part };
  }
  if (part.type === "text") return part;
  if (part.type === "image_url") return part;
  if (part.type === "file_url") return part;
  throw new Error("Unsupported message content part");
};

const normalizeMessage = (message: Message) => {
  const { role, name, tool_call_id, tool_calls } = message;

  if (role === "tool" || role === "function") {
    const content = message.content == null
      ? ""
      : ensureArray(message.content)
          .map(part => (typeof part === "string" ? part : JSON.stringify(part)))
          .join("\n");
    return { role, name, tool_call_id, content };
  }

  // tool_calls가 있는 assistant 메시지는 content가 null일 수 있음 (Groq 스펙)
  if (tool_calls && tool_calls.length > 0) {
    return { role, name, content: message.content ?? null, tool_calls };
  }

  if (message.content == null) {
    return { role, name, content: null };
  }

  const contentParts = ensureArray(message.content).map(normalizeContentPart);

  if (contentParts.length === 1 && contentParts[0].type === "text") {
    return { role, name, content: contentParts[0].text };
  }

  return { role, name, content: contentParts };
};

const normalizeToolChoice = (
  toolChoice: ToolChoice | undefined,
  tools: Tool[] | undefined
): "none" | "auto" | ToolChoiceExplicit | undefined => {
  if (!toolChoice) return undefined;
  if (toolChoice === "none" || toolChoice === "auto") return toolChoice;

  if (toolChoice === "required") {
    if (!tools || tools.length === 0) throw new Error("tool_choice 'required' was provided but no tools were configured");
    if (tools.length > 1) throw new Error("tool_choice 'required' needs a single tool or specify the tool name explicitly");
    return { type: "function", function: { name: tools[0].function.name } };
  }

  if ("name" in toolChoice) return { type: "function", function: { name: toolChoice.name } };

  return toolChoice;
};

const resolveBaseUrl = () => {
  const base = ENV.llmApiUrl;
  if (!base) throw new Error("LLM_API_URL이 설정되지 않았습니다.");
  return base.replace(/\/+$/, "");
};

const resolveApiKey = () => {
  const key = ENV.llmApiKey;
  if (!key) throw new Error("LLM_API_KEY가 설정되지 않았습니다.");
  return key;
};

const resolveModel = () => ENV.llmModel || "llama-3.3-70b-versatile";

const assertApiKey = () => { resolveApiKey(); };

const isAnthropicUrl = () => resolveBaseUrl().includes("anthropic.com");

const normalizeResponseFormat = ({
  responseFormat, response_format, outputSchema, output_schema,
}: {
  responseFormat?: ResponseFormat;
  response_format?: ResponseFormat;
  outputSchema?: OutputSchema;
  output_schema?: OutputSchema;
}): ResponseFormat | undefined => {
  const explicitFormat = responseFormat || response_format;
  if (explicitFormat) {
    if (explicitFormat.type === "json_schema" && !explicitFormat.json_schema?.schema) {
      throw new Error("responseFormat json_schema requires a defined schema object");
    }
    return explicitFormat;
  }

  const schema = outputSchema || output_schema;
  if (!schema) return undefined;
  if (!schema.name || !schema.schema) throw new Error("outputSchema requires both name and schema");

  return {
    type: "json_schema",
    json_schema: {
      name: schema.name,
      schema: schema.schema,
      ...(typeof schema.strict === "boolean" ? { strict: schema.strict } : {}),
    },
  };
};

// #endregion

// #region Anthropic Messages API adapter

type AnthropicContentBlock =
  | { type: "text"; text: string }
  | { type: "tool_use"; id: string; name: string; input: Record<string, unknown> }
  | { type: "tool_result"; tool_use_id: string; content: string };

type AnthropicMessage = {
  role: "user" | "assistant";
  content: string | AnthropicContentBlock[];
};

function toAnthropicMessages(messages: Message[]): { system: string | undefined; messages: AnthropicMessage[] } {
  let system: string | undefined;
  const result: AnthropicMessage[] = [];

  for (const msg of messages) {
    // system 메시지 추출
    if (msg.role === "system") {
      system = typeof msg.content === "string" ? msg.content : "";
      continue;
    }

    // tool result → user 메시지에 tool_result 블록으로 병합
    if (msg.role === "tool") {
      const content = typeof msg.content === "string" ? msg.content
        : msg.content == null ? ""
        : JSON.stringify(msg.content);

      const toolResult: AnthropicContentBlock = {
        type: "tool_result",
        tool_use_id: msg.tool_call_id ?? "",
        content,
      };

      const last = result[result.length - 1];
      if (last?.role === "user" && Array.isArray(last.content)) {
        last.content.push(toolResult);
      } else {
        result.push({ role: "user", content: [toolResult] });
      }
      continue;
    }

    // assistant with tool_calls → tool_use 블록 포함
    if (msg.role === "assistant" && msg.tool_calls?.length) {
      const blocks: AnthropicContentBlock[] = [];
      const textContent = typeof msg.content === "string" ? msg.content : "";
      if (textContent) blocks.push({ type: "text", text: textContent });

      for (const tc of msg.tool_calls) {
        let input: Record<string, unknown> = {};
        try { input = JSON.parse(tc.function.arguments) as Record<string, unknown>; } catch { /* empty args */ }
        blocks.push({ type: "tool_use", id: tc.id, name: tc.function.name, input });
      }
      result.push({ role: "assistant", content: blocks });
      continue;
    }

    // 일반 user/assistant 메시지
    const role = msg.role === "user" || msg.role === "assistant" ? msg.role : "user";
    const content = typeof msg.content === "string" ? msg.content
      : msg.content == null ? ""
      : Array.isArray(msg.content)
        ? msg.content.map(p => (typeof p === "string" ? p : p.type === "text" ? p.text : "")).join("")
        : "";
    result.push({ role, content });
  }

  return { system, messages: result };
}

function fromAnthropicResponse(raw: Record<string, unknown>): InvokeResult {
  const content = (raw.content ?? []) as AnthropicContentBlock[];
  const usage = raw.usage as { input_tokens?: number; output_tokens?: number } | undefined;

  const textContent = content
    .filter((c): c is { type: "text"; text: string } => c.type === "text")
    .map(c => c.text)
    .join("");

  const toolCalls: ToolCall[] = content
    .filter((c): c is { type: "tool_use"; id: string; name: string; input: Record<string, unknown> } => c.type === "tool_use")
    .map(c => ({
      id: c.id,
      type: "function" as const,
      function: { name: c.name, arguments: JSON.stringify(c.input) },
    }));

  return {
    id: (raw.id as string) ?? "",
    created: Date.now(),
    model: (raw.model as string) ?? "",
    choices: [{
      index: 0,
      message: {
        role: "assistant",
        content: textContent,
        ...(toolCalls.length > 0 ? { tool_calls: toolCalls } : {}),
      },
      finish_reason: (raw.stop_reason as string) ?? null,
    }],
    usage: usage ? {
      prompt_tokens: usage.input_tokens ?? 0,
      completion_tokens: usage.output_tokens ?? 0,
      total_tokens: (usage.input_tokens ?? 0) + (usage.output_tokens ?? 0),
    } : undefined,
  };
}

async function invokeAnthropicAPI(params: InvokeParams): Promise<InvokeResult> {
  const apiKey = resolveApiKey();
  const model = resolveModel();
  const { system, messages } = toAnthropicMessages(params.messages);

  const anthropicTools = params.tools?.map(t => ({
    name: t.function.name,
    description: t.function.description ?? "",
    input_schema: t.function.parameters ?? { type: "object", properties: {} },
  }));

  const payload: Record<string, unknown> = {
    model,
    max_tokens: params.maxTokens ?? params.max_tokens ?? 1024,
    messages,
  };

  if (system) payload.system = system;
  if (anthropicTools?.length) payload.tools = anthropicTools;

  // tool_choice 변환
  const tc = params.toolChoice ?? params.tool_choice;
  if (tc === "auto") payload.tool_choice = { type: "auto" };
  else if (tc === "none") payload.tool_choice = { type: "none" };
  else if (tc && typeof tc === "object" && "name" in tc) {
    payload.tool_choice = { type: "tool", name: tc.name };
  }

  const response = await fetch(`${resolveBaseUrl()}/messages`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  return fromAnthropicResponse((await response.json()) as Record<string, unknown>);
}

// #endregion

// #region OpenAI-compatible API (Groq, OpenAI, etc.)

async function invokeOpenAICompatAPI(params: InvokeParams): Promise<InvokeResult> {
  const {
    messages, tools, toolChoice, tool_choice,
    temperature, top_p, outputSchema, output_schema,
    responseFormat, response_format, maxTokens, max_tokens,
  } = params;

  const payload: Record<string, unknown> = {
    model: resolveModel(),
    messages: messages.map(normalizeMessage),
  };

  if (tools && tools.length > 0) payload.tools = tools;

  const normalizedToolChoice = normalizeToolChoice(toolChoice || tool_choice, tools);
  if (normalizedToolChoice) payload.tool_choice = normalizedToolChoice;

  payload.max_tokens = maxTokens ?? max_tokens ?? 32768;

  if (temperature !== undefined) payload.temperature = temperature;
  if (top_p !== undefined) payload.top_p = top_p;

  const normalizedResponseFormat = normalizeResponseFormat({
    responseFormat, response_format, outputSchema, output_schema,
  });
  if (normalizedResponseFormat) payload.response_format = normalizedResponseFormat;

  const response = await fetch(`${resolveBaseUrl()}/chat/completions`, {
    method: "POST",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${resolveApiKey()}`,
    },
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`LLM invoke failed: ${response.status} ${response.statusText} – ${errorText}`);
  }

  return (await response.json()) as InvokeResult;
}

// #endregion

export async function invokeLLM(params: InvokeParams): Promise<InvokeResult> {
  assertApiKey();
  return isAnthropicUrl()
    ? invokeAnthropicAPI(params)
    : invokeOpenAICompatAPI(params);
}
