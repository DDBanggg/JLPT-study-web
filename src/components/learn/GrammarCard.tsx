import React from "react";

export interface GrammarExample {
  jp: string;
  reading?: string;
  vi: string;
}

export interface GrammarItem {
  id: number;
  structure: string;
  formation?: string[];
  meaning_vi: string;
  usage_vi?: string;
  examples: GrammarExample[];
  notes_vi?: string[];
  source_ref?: string;
}

export interface GrammarCardProps {
  item: GrammarItem;
  index: number;
  total: number;
  isViewed: boolean;
}

export function GrammarCard({ item, index, total, isViewed }: GrammarCardProps) {
  return (
    <div
      data-testid={`grammar-card-${item.id}`}
      className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs sm:p-8 space-y-6"
    >
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-5">
        <div className="flex items-center gap-3">
          <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-blue-50 text-xs font-bold text-blue-700">
            {index + 1}
          </span>
          <h2 className="text-2xl font-bold tracking-tight text-slate-900 font-sans">
            {item.structure}
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {isViewed ? (
            <span className="rounded-full bg-emerald-50 px-2.5 py-0.5 text-xs font-semibold text-emerald-700 border border-emerald-200">
              Đã xem
            </span>
          ) : (
            <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-xs font-medium text-slate-500">
              Chưa xem
            </span>
          )}
          <span className="text-xs text-slate-400 font-medium">
            {index + 1} / {total}
          </span>
        </div>
      </div>

      {/* Formation / Meaning / Usage */}
      <div className="space-y-4">
        {item.formation && item.formation.length > 0 && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1.5">
              Cấu trúc / Kết hợp
            </div>
            <div className="flex flex-wrap gap-2">
              {item.formation.map((f, i) => (
                <span
                  key={i}
                  className="rounded-md bg-slate-50 border border-slate-200 px-3 py-1 text-sm font-mono text-slate-800"
                >
                  {f}
                </span>
              ))}
            </div>
          </div>
        )}

        <div>
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
            Ý nghĩa
          </div>
          <p className="text-base font-semibold text-slate-800 leading-relaxed">
            {item.meaning_vi}
          </p>
        </div>

        {item.usage_vi && (
          <div>
            <div className="text-xs font-semibold uppercase tracking-wider text-slate-400 mb-1">
              Giải thích cách dùng
            </div>
            <p className="text-sm text-slate-600 leading-relaxed">{item.usage_vi}</p>
          </div>
        )}
      </div>

      {/* Examples */}
      {item.examples && item.examples.length > 0 && (
        <div className="border-t border-slate-100 pt-5 space-y-3">
          <div className="text-xs font-semibold uppercase tracking-wider text-slate-400">
            Ví dụ minh họa
          </div>
          <div className="space-y-3">
            {item.examples.map((ex, i) => (
              <div
                key={i}
                className="rounded-xl border border-slate-100 bg-slate-50/70 p-4 space-y-1.5"
              >
                <div className="text-base font-medium text-slate-900 leading-relaxed">
                  {ex.jp}
                </div>
                {ex.reading && ex.reading !== ex.jp && (
                  <div className="text-xs text-slate-400 font-mono">{ex.reading}</div>
                )}
                <div className="text-sm text-slate-600">{ex.vi}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes / Source Ref */}
      {item.notes_vi && item.notes_vi.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/50 p-4 text-xs text-amber-800 space-y-1">
          <div className="font-semibold uppercase tracking-wider text-amber-700">Lưu ý</div>
          {item.notes_vi.map((n, i) => (
            <p key={i}>{n}</p>
          ))}
        </div>
      )}

      {item.source_ref && (
        <div className="text-right text-[11px] text-slate-400 italic">
          Nguồn tham khảo: {item.source_ref}
        </div>
      )}
    </div>
  );
}
