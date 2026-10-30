import { Inbox, Loader2 } from 'lucide-react';

export function StatCard({ label, value, icon: Icon, color = 'indigo' }) {
  const tones = {
    indigo: { bar: 'bg-indigo-600', chip: 'bg-indigo-50 text-indigo-700' },
    green: { bar: 'bg-emerald-500', chip: 'bg-emerald-50 text-emerald-700' },
    amber: { bar: 'bg-amber-400', chip: 'bg-amber-50 text-amber-700' },
    red: { bar: 'bg-rose-500', chip: 'bg-rose-50 text-rose-700' },
  };
  const t = tones[color] || tones.indigo;

  return (
    <div className="relative overflow-hidden rounded-xl border border-slate-200/80 bg-white p-4 pl-5">
      <span className={`absolute left-0 top-0 h-full w-1 ${t.bar}`} />
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="font-display text-3xl font-semibold tabular-nums text-ink">{value}</p>
          <p className="mt-1 text-sm text-slate-500">{label}</p>
        </div>
        {Icon && (
          <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-lg ${t.chip}`}>
            <Icon size={18} />
          </span>
        )}
      </div>
    </div>
  );
}

export function PageHeader({ title, subtitle, action }) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h2 className="font-display text-2xl font-semibold text-ink">{title}</h2>
        {subtitle && <p className="mt-1 text-sm text-slate-500">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

const STATUS_META = {
  DRAFT: { label: 'Draft', dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-700' },
  PENDING_APPROVAL: { label: 'Pending approval', dot: 'bg-amber-500', cls: 'bg-amber-50 text-amber-800' },
  APPROVED: { label: 'Approved', dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-800' },
  REJECTED: { label: 'Rejected', dot: 'bg-rose-500', cls: 'bg-rose-50 text-rose-800' },
  ONGOING: { label: 'Ongoing', dot: 'bg-sky-500', cls: 'bg-sky-50 text-sky-800' },
  COMPLETED: { label: 'Completed', dot: 'bg-slate-700', cls: 'bg-slate-100 text-slate-800' },
  CANCELLED: { label: 'Cancelled', dot: 'bg-rose-500', cls: 'bg-rose-50 text-rose-800' },
  REGISTERED: { label: 'Registered', dot: 'bg-emerald-500', cls: 'bg-emerald-50 text-emerald-800' },
  ATTENDED: { label: 'Attended', dot: 'bg-sky-500', cls: 'bg-sky-50 text-sky-800' },
  ABSENT: { label: 'Absent', dot: 'bg-slate-400', cls: 'bg-slate-100 text-slate-600' },
};

export function StatusBadge({ status }) {
  const meta = STATUS_META[status] || {
    label: status?.replace('_', ' ') || '-',
    dot: 'bg-slate-400',
    cls: 'bg-slate-100 text-slate-700',
  };
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-xs font-medium ${meta.cls}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${meta.dot}`} />
      {meta.label}
    </span>
  );
}

export function EmptyState({ message }) {
  return (
    <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-slate-300 bg-white/60 py-14 text-center">
      <span className="grid h-11 w-11 place-items-center rounded-full bg-slate-100 text-slate-400">
        <Inbox size={20} />
      </span>
      <p className="max-w-xs text-sm text-slate-500">{message}</p>
    </div>
  );
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center gap-2 py-14 text-sm text-slate-400">
      <Loader2 size={18} className="animate-spin" />
      Loading...
    </div>
  );
}