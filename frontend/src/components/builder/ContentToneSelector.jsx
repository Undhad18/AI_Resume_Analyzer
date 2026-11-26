/**
 * Content Tone Selector (Lesson 8.3)
 */

const TONES = [
  {
    id: "professional",
    name: "Professional",
    desc: "Formal, balanced industry phrasing"
  },
  {
    id: "concise",
    name: "Concise",
    desc: "Direct, punchy, zero fluff"
  },
  {
    id: "technical",
    name: "Technical",
    desc: "Architecture & concrete tools"
  },
  {
    id: "achievement_focused",
    name: "Achievement-Focused",
    desc: "Active verbs & truthful outcomes"
  }
];

export const ContentToneSelector = ({ selectedTone = "professional", onSelectTone, disabled = false }) => {
  return (
    <div className="space-y-1.5">
      <label className="text-[11px] font-bold text-slate-700 uppercase tracking-wider block">
        Writing Style / Tone
      </label>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {TONES.map((tone) => {
          const isSelected = selectedTone === tone.id;
          return (
            <button
              key={tone.id}
              type="button"
              disabled={disabled}
              onClick={() => onSelectTone(tone.id)}
              className={`p-2.5 rounded-xl border text-left transition cursor-pointer text-xs disabled:opacity-50 ${
                isSelected
                  ? "border-blue-600 bg-blue-50/70 text-blue-900 ring-1 ring-blue-500/30"
                  : "border-slate-200 bg-white hover:bg-slate-50 text-slate-700"
              }`}
            >
              <span className="font-bold block leading-tight">{tone.name}</span>
              <span className="text-[10px] text-slate-500 leading-tight block mt-0.5">
                {tone.desc}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ContentToneSelector;
