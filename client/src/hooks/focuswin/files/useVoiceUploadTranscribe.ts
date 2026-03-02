import { useCallback, useRef } from "react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { TRPCClientError } from "@trpc/client";

export function useVoiceUploadTranscribe() {
  const uploadingAbortRef = useRef<AbortController | null>(null);

  const prepareUpload = trpc.crm.files.prepareUpload.useMutation();
  const confirmUpload = trpc.crm.files.confirmUpload.useMutation();
  const transcribeFile = trpc.crm.files.transcribeFile.useMutation();

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
          const t = await putRes.text().catch(() => "");
          console.error("PUT failed:", putRes.status, t);
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

        // 4) transcribeFile
        onState?.("transcribing");
        const tx = await transcribeFile.mutateAsync({ file_idno: fileId });
        console.log("transcribe response =", tx);
        console.log("transcribe text =", (tx as any)?.text);
        onTranscribed(tx.text);

        onState?.("done");
      } catch (e) {
        if ((e as any)?.name === "AbortError") {
          toast.message("작업을 취소했습니다.");
        }
        else if (e instanceof TRPCClientError) {
          toast.error(e.message);
        }
        else {
          console.error(e);
          toast.error("처리 중 오류가 발생했습니다.");
        }

        onState?.("idle");
      } finally {
        uploadingAbortRef.current = null;
        onFinally?.();
      }
    },
    [prepareUpload, confirmUpload, transcribeFile]
  );

  return {
    uploadAndTranscribe,
    abort,
    // 디버그용(필요 없으면 안 써도 됨)
    errors: {
      prepareUpload: prepareUpload.error,
      confirmUpload: confirmUpload.error,
      transcribeFile: transcribeFile.error,
    },
  };
}