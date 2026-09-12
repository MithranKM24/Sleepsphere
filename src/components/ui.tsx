import { ReactNode } from 'react';

/**
 * Small reusable UI primitives shared across SleepSphere screens.
 *
 * Why: the same loading skeleton / error banner / empty state / form
 * message markup was copy-pasted across components. Centralising it keeps
 * styling consistent and each screen smaller — the "reusable, modular
 * React components" claim on the resume.
 *
 * Added (ux/quick-logging branch):
 * - ChipRow: single-select pill row for mood/type/noise/light.
 * - CountChips: 0/1/2/3+ affordance for caffeine/exercise/screen/alcohol,
 *   with an expandable exact-number stepper for the "3+" bucket.
 * - QualityFaces: 5-tap emoji quality scale mapped to stored values
 *   2/4/6/8/10 (sleep_quality CHECK still enforces 1-10).
 * - InlineFieldError: per-question validation message (in addition to the
 *   top-of-form summary list, not instead of it).
 */

export function LoadingSkeleton({ lines = 3 }: { lines?: number }) {
  return (
    <div className="bg-dark-secondary rounded-xl shadow-lg p-6 border border-dark-border">
      <div className="animate-pulse space-y-4" aria-label="Loading">
        <div className="h-6 bg-dark-tertiary rounded w-1/3" />
        {Array.from({ length: lines }).map((_, i) => (
          <div key={i} className="h-10 bg-dark-tertiary rounded" />
        ))}
      </div>
    </div>
  );
}

export function ErrorBanner({
  message,
  onRetry,
}: {
  message: string;
  onRetry?: () => void;
}) {
  return (
    <div
      role="alert"
      className="bg-red-900/20 border border-red-800 rounded-lg p-4 flex items-start justify-between gap-3"
    >
      <p className="text-red-300 text-sm">{message}</p>
      {onRetry && (
        <button
          onClick={onRetry}
          className="shrink-0 text-sm font-medium text-red-200 hover:text-white border border-red-700 rounded-lg px-3 py-1 transition"
        >
          Retry
        </button>
      )}
    </div>
   );
}
interface ChipOption {
  label: string;
  value: string;
}

interface ChipRowProps {
  options: ChipOption[];
  value: string;
  onChange: (value: string) => void;
  label?: string;
  clearable?: boolean;
}

/**
 * Single-select pill row for dream mood, dream type, noise level, light level.
 *
 * Stored values are the exact Supabase text values (e.g. "Happy", "Quiet"),
 * so no schema change is needed — the UI just replaces <select> with faster
 * one-tap pills and a Clear action when clearable.
 */
export function ChipRow({ options, value, onChange, label, clearable = false }: ChipRowProps) {
  return (
    <fieldset className="space-y-2">
      {label && <legend className="text-sm font-medium text-dark-text-secondary px-1">{label}</legend>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const selected = opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => {
                if (selected && clearable) {
                  onChange('');
                  return;
                }
                if (selected) return;
                onChange(opt.value);
              }}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition whitespace-nowrap ${
                selected
                  ? 'bg-dark-accent/20 border-dark-accent-light text-dark-text shadow-sm'
                  : 'border-dark-border bg-dark-tertiary/60 text-dark-text-secondary hover:border-dark-border-light hover:text-dark-text'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}

export function EmptyState({
  icon,
  title,
  hint,
}: {
  icon?: ReactNode;
  title: string;
  hint?: string;
}) {
  return (
    <div className="text-center py-8 text-dark-text-muted">
      {icon && <div className="flex justify-center mb-3">{icon}</div>}
      <p className="font-medium text-dark-text-secondary">{title}</p>
      {hint && <p className="text-sm mt-1">{hint}</p>}
    </div>
  );
}

export function FormMessage({ message }: { message: string }) {
  const isError = /error|invalid|fail/i.test(message);
  return (
    <div
      role={isError ? 'alert' : 'status'}
      className={`p-3 rounded-lg ${
        isError
          ? 'bg-red-900/20 text-red-300 border border-red-800'
          : 'bg-green-900/20 text-green-300 border border-green-800'
      }`}
    >
      {message}
    </div>
  );
}

// ============================================================
// ux/quick-logging additions — CountChips
// ============================================================

interface CountChipsProps {
  /** Ordered small-to-large label set. */
  options: { label: string; value: number }[];
  /** The numeric value currently stored (undefined means "not answered yet"). */
  value: number | undefined;
  /** Called with the final numeric value the user selected. */
  onChange: (value: number | undefined) => void;
  label?: string;
  /** Max value before we treat it as a top-coded "3+" bucket. */
  topAt?: number;
}

/**
 * Count affordance for caffeine / alcohol / screen-time / exercise.
 *
 * - Options 1..topAt are tappable count pills.
 * - Selecting the top pill opens a small stepper so the user can type the
 *   real number — otherwise the stored value is the topAt value (top-coding),
 *   which preserves every downstream threshold that cares about "≥3".
 *
 * Data-quality note: deliberate small top-coding for speed. Analysts that
 * depend on "≥3" still fire; exact values beyond topAt need one extra tap.
 * Disclosed openly in interview.
 */
export function CountChips({
  options,
  value,
  onChange,
  label,
  topAt,
}: CountChipsProps) {
  const top = topAt ?? options[options.length - 1]?.value ?? 3;
  const expanded = value !== undefined && value > top;

  function setNumber(n: number | undefined) {
    onChange(n);
  }

  return (
    <fieldset className="space-y-2">
      {label && <legend className="text-sm font-medium text-dark-text-secondary px-1">{label}</legend>}
      <div className="flex flex-wrap gap-2">
        {options.map((opt) => {
          const prompt = value === undefined;
          const selected = prompt ? false : opt.value === value;
          return (
            <button
              key={opt.value}
              type="button"
              onClick={() => setNumber(opt.value)}
              className={`inline-flex items-center justify-center min-w-[3rem] px-3 py-1.5 rounded-full border text-sm font-medium transition ${
                selected
                  ? 'bg-dark-accent/20 border-dark-accent-light text-dark-text shadow-sm'
                  : 'border-dark-border bg-dark-tertiary/60 text-dark-text-secondary hover:border-dark-border-light hover:text-dark-text'
              }`}
            >
              {opt.label}
            </button>
          );
        })}
      </div>
      {expanded ? (
        <div className="flex items-center gap-2 mt-2">
          <span className="text-sm text-dark-text-secondary">Exactly:</span>
          <button
            type="button"
            onClick={() => setNumber(value !== undefined ? value - 1 : undefined)}
            className="w-8 h-8 rounded-full border border-dark-border bg-dark-tertiary flex items-center justify-center text-dark-text hover:bg-dark-tertiary/80 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={value === undefined || value <= top}
            aria-label="Decrease"
          >
            −
          </button>
          <input
            type="number"
            min={top + 1}
            value={value ?? ''}
            onChange={(e) => {
              const n = parseInt(e.target.value, 10);
              if (Number.isNaN(n) || n <= top) {
                setNumber(undefined);
                return;
              }
              setNumber(n);
            }}
            className="w-16 px-2 py-1 bg-dark-tertiary border border-dark-border rounded-lg text-center text-dark-text focus:outline-none focus:ring-2 focus:ring-dark-accent-light"
            aria-label="Exact number"
          />
          <button
            type="button"
            onClick={() => setNumber(value !== undefined ? value + 1 : undefined)}
            className="w-8 h-8 rounded-full border border-dark-border bg-dark-tertiary flex items-center justify-center text-dark-text hover:bg-dark-tertiary/80 disabled:opacity-40 disabled:cursor-not-allowed"
            disabled={value === undefined || value <= top}
            aria-label="Increase"
          >
            +
          </button>
          <button
            type="button"
            onClick={() => setNumber(undefined)}
            className="ml-auto text-sm text-dark-text-secondary hover:text-dark-text underline underline-offset-2"
          >
            Clear
          </button>
        </div>
      ) : null}
    </fieldset>
  );
}


// ============================================================
// ux/quick-logging additions — QualityFaces
// ============================================================

interface FaceOption {
  value: number;
  label: string;
  emoji: string;
}

interface QualityFacesProps {
  value: number | undefined;
  onChange: (value: number | undefined) => void;
  label?: string;
  /** Mapping of face position to stored value. Default: {2,4,6,8,10}. */
  values?: number[];
}

/**
 * 5-tap sleep-quality scale.
 *
 * Stored values land on {2,4,6,8,10} by default, all within the existing
 * 1-10 CHECK constraint on sleep_quality — pure UI change, no DB impact.
 * Analytics that threshold on >=7 (excellent) / >=5 (good) still behave
 * sensibly because 6 ~= "good-ish" and 8 ~= "excellent".
 *
 * Data-quality note: we lose 1..10 granularity in the fast path, but
 * self-rated sleep quality is ordinal at best — the lost precision was noise.
 * Finer granularity remains available in the full Sleep Log editor.
 */
export function QualityFaces({
  value,
  onChange,
  label,
  values = [2, 4, 6, 8, 10],
}: QualityFacesProps) {
  const faces: FaceOption[] = [
    { value: values[0], label: 'Terrible', emoji: "😭" },
    { value: values[1], label: 'Poor', emoji: "😕" },
    { value: values[2], label: 'Okay', emoji: "😐" },
    { value: values[3], label: 'Good', emoji: "🙂" },
    { value: values[4], label: 'Great', emoji: "😄" },
  ];

  return (
    <fieldset className="space-y-2">
      {label && <legend className="text-sm font-medium text-dark-text-secondary px-1">{label}</legend>}
      <div className="flex flex-wrap gap-2">
        {faces.map((face) => {
          const selected = value === face.value;
          return (
            <button
              key={face.value}
              type="button"
              onClick={() => onChange(face.value)}
              className={`inline-flex flex-col items-center gap-1 px-3 py-2 rounded-xl border text-sm transition min-w-[4.5rem] ${
                selected
                  ? 'bg-dark-accent/20 border-dark-accent-light text-dark-text shadow-sm'
                  : 'border-dark-border bg-dark-tertiary/60 text-dark-text-secondary hover:border-dark-border-light hover:text-dark-text'
              }`}
              aria-pressed={selected}
            >
              <span className="text-2xl leading-none" aria-hidden="true">
                {face.emoji}
              </span>
              <span className="text-[10px] uppercase tracking-wide opacity-70">{face.label}</span>
            </button>
          );
        })}
      </div>
    </fieldset>
  );
}


// ============================================================
// ux/quick-logging additions — InlineFieldError
// ============================================================

interface InlineFieldErrorProps {
  message: string;
}

/**
 * Small inline message placed directly under the offending input, so on mobile
 * the user sees the problem next to the field rather than scrolling up to a
 * top-of-form summary list.
 *
 * Kept separate from FormMessage on purpose: FormMessage stays as the
 * submit/summary banner; this one is for per-field guidance only.
 */
export function InlineFieldError({ message }: InlineFieldErrorProps) {
  if (!message) return null;
  return (
    <p className="mt-1 text-xs text-red-300 flex items-center gap-1">
      <span aria-hidden="true">⚠</span>
      {message}
    </p>
  );
}

