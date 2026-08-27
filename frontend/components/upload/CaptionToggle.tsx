'use client';

type CaptionLang = 'hinglish' | 'hindi' | 'english';

interface CaptionToggleProps {
  value: CaptionLang;
  onChange: (lang: CaptionLang) => void;
  disabled?: boolean;
}

const OPTIONS: { value: CaptionLang; label: string; flag: string }[] = [
  { value: 'hinglish', label: 'Hinglish',  flag: '🇮🇳' },
  { value: 'hindi',    label: 'Hindi',     flag: '🔠' },
  { value: 'english',  label: 'English',   flag: '🇬🇧' },
];

export function CaptionToggle({ value, onChange, disabled }: CaptionToggleProps) {
  return (
    <div className="space-y-2">
      <label className="text-text-muted text-xs font-medium uppercase tracking-wider">
        Caption Language
      </label>
      <div className="flex gap-2">
        {OPTIONS.map((opt) => {
          const active = value === opt.value;
          return (
            <button
              key={opt.value}
              onClick={() => onChange(opt.value)}
              disabled={disabled}
              className={`flex-1 flex items-center justify-center gap-1.5 py-2.5 rounded-xl text-sm font-semibold border transition-all duration-200 ${
                active
                  ? 'bg-neon-purple/20 border-neon-purple text-neon-purple shadow-neon-purple'
                  : 'bg-surface-raised border-[#333] text-text-muted hover:border-neon-purple/40 hover:text-text-primary'
              } disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              <span>{opt.flag}</span>
              <span>{opt.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default CaptionToggle;
