export const ENV = {
  appId: process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  databaseUrl: process.env.DATABASE_URL ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",
  isProduction: process.env.NODE_ENV === "production",
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",
  // LLM 전용 설정 (없으면 Forge API로 폴백)
  llmApiUrl: process.env.LLM_API_URL ?? "",
  llmApiKey: process.env.LLM_API_KEY ?? "",
  llmModel: process.env.LLM_MODEL ?? "",
  // STT(음성→텍스트) 전용 설정 (없으면 Forge API로 폴백)
  sttApiUrl: process.env.STT_API_URL ?? "",
  sttApiKey: process.env.STT_API_KEY ?? "",
  sttModel: process.env.STT_MODEL ?? "whisper-1",
  allowedAudioHosts: process.env.ALLOWED_AUDIO_HOSTS ?? "",
};
