import { COMPANY } from "@/config/company";

function formatTelHref(v: string) {
  // tel 링크용: 숫자만 남김
  return `tel:${v.replace(/[^\d]/g, "")}`;
}

export default function AppFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="border-t border-slate-300 bg-white">
      <div className="mx-auto max-w-6xl px-4 py-10">
        <div className="grid gap-8 sm:grid-cols-[1fr_auto] sm:items-start">
          {/* Left */}
          <div className="min-w-0">
            <p className="text-sm font-black tracking-tight text-slate-900">
              {COMPANY.legalName}
            </p>

            <div className="mt-3 space-y-2 text-sm text-slate-600">
              <p className="leading-relaxed">{COMPANY.address}</p>

              <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                <span className="text-slate-400">Tel.</span>
                <a className="font-semibold text-slate-700 hover:underline" href={formatTelHref(COMPANY.tel)}>
                  {COMPANY.tel}
                </a>

                <span className="text-slate-200">•</span>

                <span className="text-slate-400">FAX.</span>
                <span className="font-semibold text-slate-700">{COMPANY.fax}</span>
              </div>
            </div>

            <p className="mt-6 text-xs text-slate-400">
              © {year} {COMPANY.legalName}. All rights reserved.
            </p>
          </div>

          {/* Right */}
          <div className="flex flex-col gap-3 sm:items-end">
            <div className="flex items-center gap-3 text-sm font-semibold">
              {COMPANY.links.terms ? (
                <a className="text-slate-600 hover:text-slate-900 hover:underline" href={COMPANY.links.terms}>
                  이용약관
                </a>
              ) : (
                <span className="text-slate-400">이용약관(준비 중)</span>
              )}

              <span className="text-slate-200">•</span>

              {COMPANY.links.privacy ? (
                <a className="text-slate-600 hover:text-slate-900 hover:underline" href={COMPANY.links.privacy}>
                  개인정보처리방침
                </a>
              ) : (
                <span className="text-slate-400">개인정보처리방침(준비 중)</span>
              )}
            </div>

            <div className="text-xs text-slate-400 sm:text-right leading-relaxed">
              서비스 문의/제휴는 전화로 연락 부탁드립니다.
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}