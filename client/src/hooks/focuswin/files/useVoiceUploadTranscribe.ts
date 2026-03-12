// src/hooks/focuswin/files/useVoiceUploadTranscribe.ts

// #region Imports

import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { handleApiError } from "@/lib/handleApiError";

// #endregion

// #region Polling Helper

/**
 * STT 결과 polling
 *
 * - intervalMs 간격으로 결과 조회
 * - done → 즉시 반환
 * - failed → 즉시 에러 반환
 * - maxAttempts 초과 시 timeout 처리
 */
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

    if (data.jobs_stat === "done") {
      return { sttx_text: data.sttx_text, fail_mess: null };
    }

    if (data.jobs_stat === "failed") {
      return { sttx_text: null, fail_mess: data.fail_mess };
    }

    await new Promise((r) => setTimeout(r, opts.intervalMs));
  }

  return { sttx_text: null, fail_mess: "STT 처리 시간이 초과되었습니다." };
}

// #endregion

// #region Hook

export function useVoiceUploadTranscribe() {
  const uploadingAbortRef = useRef<AbortController | null>(null);

  const prepareUpload = trpc.crm.files.prepareUpload.useMutation();
  const confirmUpload = trpc.crm.files.confirmUpload.useMutation();
  const transcribeFile = trpc.crm.files.transcribeFile.useMutation();

  const utils = trpc.useUtils();

  // #region Abort

  const abort = useCallback(() => {
    uploadingAbortRef.current?.abort();
    uploadingAbortRef.current = null;
  }, []);

  // #endregion

  // #region Upload + Transcribe Flow

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
        // #region File Size Check

        if (blob.size > maxBytes) {
          toast.error(
            `파일 크기가 ${(maxBytes / (1024 * 1024)).toFixed(0)}MB를 초과합니다.`
          );
          onState?.("idle");
          return;
        }

        // #endregion

        // #region 1. prepareUpload

        onState?.("uploading");

        const prep = await prepareUpload.mutateAsync({
          file_name: fileName,
          mime_type: mimeType,
        });

        // #endregion

        // #region 2. Upload to Storage (Presigned URL)

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

        // #endregion

        // #region 3. confirmUpload

        onState?.("confirming");

        const confirmed = await confirmUpload.mutateAsync({
          file_path: prep.file_path,
          file_name: fileName,
          mime_type: mimeType,
          file_size: blob.size,
        });

        const fileId = confirmed.file_idno;
        onUploadedFileId?.(fileId);

        // #endregion

        // #region 4. Enqueue STT Job

        onState?.("transcribing");

        await transcribeFile.mutateAsync({ file_idno: fileId });

        // #endregion

        // #region 5. Immediate Result Check (핵심 개선)

        /**
         * worker가 이미 끝난 경우
         * polling 기다리지 않고 즉시 결과 반영
         */
        const first = await utils.crm.files.transcribeFileResult.fetch({
          file_idno: fileId,
        });

        if (first.jobs_stat === "done") {
          if (first.sttx_text) {
            onTranscribed(first.sttx_text);
            onState?.("done");
            return;
          }

          throw new Error("STT 결과가 비어 있습니다.");
        }

        if (first.jobs_stat === "failed") {
          throw new Error(first.fail_mess ?? "STT 처리에 실패했습니다.");
        }

        // #endregion

        // #region 6. Polling (속도 개선)

        const result = await pollTranscribeResult(
          (args) => utils.crm.files.transcribeFileResult.fetch(args),
          fileId,
          {
            intervalMs: 700, // 🔥 기존 3000 → 700ms
            maxAttempts: 20,
          }
        );

        if (result.sttx_text) {
          onTranscribed(result.sttx_text);
          onState?.("done");
        } else {
          throw new Error(result.fail_mess ?? "STT 처리에 실패했습니다.");
        }

        // #endregion
      } catch (e) {
        const meta = handleApiError(e);

        if (meta.appCode === "ABORTED") {
          // silent
        }

        onState?.("idle");
      } finally {
        uploadingAbortRef.current = null;
        onFinally?.();
      }
    },
    [prepareUpload, confirmUpload, transcribeFile, utils]
  );

  // #endregion

  return {
    uploadAndTranscribe,
    abort,
  };
}

// #endregion