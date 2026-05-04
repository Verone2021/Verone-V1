'use client';

interface Props {
  label: string;
  children: React.ReactNode;
}

export function PreviewCard({ label, children }: Props) {
  return (
    <div className="overflow-hidden rounded-md border border-gray-200">
      <div className="border-b border-gray-100 bg-gray-50/50 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-[0.18em] text-gray-600">
          {label}
        </span>
      </div>
      <div>{children}</div>
    </div>
  );
}
