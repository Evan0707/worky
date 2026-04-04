import { type ReactNode } from "react";

interface LegalPageProps {
  title: string;
  lastUpdate: string;
  children: ReactNode;
}

export function LegalPage({ title, lastUpdate, children }: LegalPageProps) {
  return (
    <div className="pt-28 pb-20">
      <div className="mx-auto max-w-3xl px-6">
        <div className="mb-12 border-b border-white/[0.06] pb-8">
          <h1 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
            {title}
          </h1>
          <p className="mt-2 text-[13px] text-neutral-600">{lastUpdate}</p>
        </div>
        <div className="space-y-10">{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="space-y-3">
      <h2 className="text-[15px] font-semibold tracking-tight text-white">
        {title}
      </h2>
      {children}
    </section>
  );
}

export function LegalParagraph({ children }: { children: ReactNode }) {
  return (
    <p className="text-[14px] text-neutral-500 leading-relaxed">{children}</p>
  );
}

export function LegalList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5 text-[14px] text-neutral-500 ml-4">
      {items.map((item) => (
        <li key={item} className="flex items-start gap-2">
          <span className="mt-2 h-1 w-1 rounded-full bg-neutral-700 shrink-0" />
          <span className="leading-relaxed">{item}</span>
        </li>
      ))}
    </ul>
  );
}
