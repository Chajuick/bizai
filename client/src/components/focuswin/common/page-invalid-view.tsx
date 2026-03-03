import { Link } from "wouter";
import { PageInvalidAction } from "./page-scaffold";
import { Button } from "./ui/button";

type PageInvalidViewProps = {
  icon?: React.ReactNode;
  title: React.ReactNode;
  description?: React.ReactNode;
  actions?: PageInvalidAction[];
}

export function PageInvalidView({ icon, title, description, actions }: PageInvalidViewProps) {
  return (
    <div className="max-w-md mx-auto pt-14 pb-24">
      <div className="p-6 text-center">
        <div className="mx-auto mb-4 w-12 h-12 rounded-3xl bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-700">
          {icon}
        </div>

        <p className="text-base font-black text-slate-900">{title ?? "데이터"}를 찾을 수 없어요</p>
        <p className="mt-2 text-sm text-slate-600 leading-relaxed">
          {description ? (
            description
          ) : (
            <>
              삭제되었거나 링크가 잘못되었을 수 있어요.
              <br />
              목록으로 돌아가 다시 확인해보세요.
            </>
          )}
        </p>

        {actions?.length ? (
          <div className="mt-5 flex gap-2 justify-center">
            {actions.map((a, i) =>
              "href" in a ? (
                <Link key={i} href={a.href}>
                  <Button variant={a.variant ?? "outline"}>
                    {a.icon}
                    {a.label}
                  </Button>
                </Link>
              ) : (
                <Button key={i} variant={a.variant ?? "solid"} onClick={a.onClick}>
                  {a.icon}
                  {a.label}
                </Button>
              )
            )}
          </div>
        ) : null}
      </div>
    </div>
  );
}
