"use client";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Home } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-white p-5">
      <Card className="w-full max-w-md rounded-3xl border border-slate-100 bg-white shadow-[0_16px_50px_rgba(15,23,42,0.08)]">
        <CardContent className="pt-10 pb-9 text-center">
          <div className="mx-auto w-16 h-16 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center">
            <AlertCircle className="h-7 w-7 text-blue-600" />
          </div>

          <p className="mt-5 text-[11px] font-extrabold tracking-[0.18em] text-slate-400 uppercase">
            NOT FOUND
          </p>

          <h1 className="mt-2 text-3xl font-black text-slate-900">페이지를 찾을 수 없어요</h1>
          <p className="mt-2 text-sm text-slate-500 leading-relaxed">
            주소가 잘못되었거나, 페이지가 이동/삭제되었을 수 있어요.
          </p>

          <div className="mt-7 flex flex-col gap-2">
            <Button
              onClick={() => setLocation("/")}
              className="w-full rounded-2xl text-white font-bold"
              style={{
                background: "rgb(37, 99, 235)",
                boxShadow: "0 10px 26px rgba(37,99,235,0.20)",
              }}
            >
              <Home className="w-4 h-4 mr-2" />
              홈으로 가기
            </Button>

            <Button
              variant="outline"
              onClick={() => window.history.back()}
              className="w-full rounded-2xl font-bold"
            >
              이전 페이지
            </Button>
          </div>

          <p className="mt-6 text-xs text-slate-400">문제가 계속되면 관리자에게 알려주세요.</p>
        </CardContent>
      </Card>
    </div>
  );
}