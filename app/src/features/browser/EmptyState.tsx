import { Database } from 'lucide-react';

export function EmptyState({ title, description }: { title: string; description?: string }) {
  return (
    <div className="flex flex-col items-center justify-center flex-1 gap-3 text-[var(--text-muted)] py-16">
      <Database size={40} strokeWidth={1.25} />
      <h2 className="text-base font-medium text-[var(--text-primary)]">{title}</h2>
      {description && <p className="text-sm max-w-md text-center">{description}</p>}
    </div>
  );
}
