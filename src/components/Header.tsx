import { ShieldAlert } from 'lucide-react';

export function Header() {
  return (
    <header className="space-y-4 py-8 sm:py-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm font-medium text-cyan-200">Korea Market MA50 Disparity</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-normal text-white sm:text-4xl">
            한국시장 50일 이격도 트래커
          </h1>
          <p className="mt-3 text-base text-slate-300">
            코스피 · 삼성전자 · SK하이닉스 과열/과열해소 확인용
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-md border border-amber-300/25 bg-amber-300/10 px-3 py-2 text-sm text-amber-100">
          <ShieldAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>투자 판단의 책임은 본인에게 있습니다</span>
        </div>
      </div>
    </header>
  );
}
