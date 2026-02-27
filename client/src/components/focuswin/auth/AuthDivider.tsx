import * as React from "react";

export default function AuthDivider({ label = "또는 이메일로" }: { label?: string }) {
  return (
    <div className="relative my-5">
      <div className="absolute inset-0 flex items-center">
        <div className="w-full border-t border-slate-200" />
      </div>
      <div className="relative flex justify-center">
        <span className="bg-white px-3 text-xs text-slate-400 font-medium">{label}</span>
      </div>
    </div>
  );
}