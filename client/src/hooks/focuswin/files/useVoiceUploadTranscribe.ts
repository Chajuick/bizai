import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { handleApiError } from "@/lib/handleApiError";

async function pollTranscribeResult(
  fetchFn: (args: { file_idno: number }) => Promise<{
    jobs_stat: "queued" | "running" | "done" | "failed" | null;
    sttx_text: string | null;
    fail_mess: string | null;
  }>,
  file_idno: number,
  opts: { intervalMs: number; maxAttempts: number }
): Promise<{ sttx_text: string | null; fail_mess: string | null }> {
  for (let i = 0; i < opts.maxAttempts; i++) {
    const data = await fetchFn({ file_idno });
    if (data.jobs_stat === "done") return { sttx_text: data.sttx_text, fail_mess: null };
    if (data.jobs_stat === "failed") return { sttx_text: null, fail_mess: data.fail_mess };
    await new Promise((r) => setTimeout(r, opts.intervalMs));
  }
  return { sttx_text: null, fail_mess: "STT 처리 시간이 초과되었습니다." };
}

export function useVoiceUploadTranscribe() {
  const uploadingAbortRef = useRef<AbortController | null>(null);

  const prepareUpload = trpc.crm.files.prepareUpload.useMutation();
  const confirmUpload = trpc.crm.files.confirmUpload.useMutation();
  const transcribeFile = trpc.crm.files.transcribeFile.useMutation();
  const utils = trpc.useUtils();

  const abort = useCallback(() => {
    uploadingAbortRef.current?.abort();
    uploadingAbortRef.current = null;
  }, []);

  const uploadAndTranscribe = useCallback(
    async (args: {
      blob: Blob;
      fileName: string;
      mimeType: string;
      maxBytes: number;
      onUploadedFileId?: (fileId: number) => void;
      onTranscribed: (text: string) => void;
      onState?: (s: "idle" | "uploading" | "confirming" | "transcribing" | "done") => void;
      onFinally?: () => void;
    }) => {
      const {
        blob,
        fileName,
        mimeType,
        maxBytes,
        onUploadedFileId,
        onTranscribed,
        onState,
        onFinally,
      } = args;

      try {
        if (blob.size > maxBytes) {
          // 브라우저에서만 알 수 있는 크기 제한 — 직접 처리
          toast.error(`파일 크기가 ${(maxBytes / (1024 * 1024)).toFixed(0)}MB를 초과합니다.`);
          onState?.("idle");
          return;
        }

        // 1) prepareUpload
        onState?.("uploading");
        const prep = await prepareUpload.mutateAsync({
          file_name: fileName,
          mime_type: mimeType,
        });

        // 2) PUT to presigned URL
        uploadingAbortRef.current = new AbortController();

        const putRes = await fetch(prep.upload_url, {
          method: "PUT",
          body: blob,
          headers: { "Content-Type": mimeType },
          signal: uploadingAbortRef.current.signal,
        });

        if (!putRes.ok) {
          toast.error("스토리지 업로드에 실패했습니다. (CORS/권한 확인)");
          onState?.("idle");
          return;
        }

        // 3) confirmUpload
        onState?.("confirming");
        const confirmed = await confirmUpload.mutateAsync({
          file_path: prep.file_path,
          file_name: fileName,
          mime_type: mimeType,
          file_size: blob.size,
        });

        const fileId = confirmed.file_idno;
        onUploadedFileId?.(fileId);

        // 4) transcribeFile — 즉시 jobs_idno 반환 (비동기 큐)
        onState?.("transcribing");
        await transcribeFile.mutateAsync({ file_idno: fileId });

        // 5) 폴링: 3초마다 최대 60초 (20회)
        const result = await pollTranscribeResult(
          (args) => utils.crm.files.transcribeFileResult.fetch(args),
          fileId,
          { intervalMs: 3000, maxAttempts: 20 }
        );

        if (result.sttx_text) {
          onTranscribed(result.sttx_text);
          onState?.("done");
        } else {
          throw new Error(result.fail_mess ?? "STT 처리에 실패했습니다.");
        }
      } catch (e) {
        const meta = handleApiError(e);
        // AbortError는 silent — 취소 버튼이 직접 toast를 띄우므로 여기선 무시
        if (meta.appCode === "ABORTED") {
          // no-op
        }
        onState?.("idle");
      } finally {
        uploadingAbortRef.current = null;
        onFinally?.();
      }
    },
    [prepareUpload, confirmUpload, transcribeFile, utils]
  );

  return {
    uploadAndTranscribe,
    abort,
  };
}
