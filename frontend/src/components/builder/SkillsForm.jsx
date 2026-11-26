import { useState } from "react";
import { Wrench, Plus, X, AlertCircle, Edit2, Check, Sparkles } from "lucide-react";

export const SkillsForm = ({ skills = [], onChange, onAdd, onRemove, onEdit, onOpenGenerator }) => {
  const [skillInput, setSkillInput] = useState("");
  const [duplicateWarning, setDuplicateWarning] = useState(null);
  const [editingIndex, setEditingIndex] = useState(null);
  const [editingText, setEditingText] = useState("");

  const handleAddSkill = () => {
    const trimmed = skillInput.trim();
    if (!trimmed) return;

    setDuplicateWarning(null);

    // Case-insensitive duplicate check
    const isDuplicate = skills.some(
      (s) => (typeof s === "string" ? s : s.name || "").toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setDuplicateWarning(`"${trimmed}" is already added to your skills list.`);
      return;
    }

    if (onAdd) {
      onAdd(trimmed);
    } else if (onChange) {
      onChange([...skills, trimmed]);
    }
    setSkillInput("");
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      handleAddSkill();
    }
  };

  const handleRemoveSkill = (indexToRemove) => {
    setDuplicateWarning(null);
    if (editingIndex === indexToRemove) setEditingIndex(null);
    if (onRemove) {
      onRemove(indexToRemove);
    } else if (onChange) {
      onChange(skills.filter((_, idx) => idx !== indexToRemove));
    }
  };

  const handleStartEdit = (index, currentSkill) => {
    setEditingIndex(index);
    setEditingText(typeof currentSkill === "string" ? currentSkill : currentSkill.name || "");
    setDuplicateWarning(null);
  };

  const handleSaveEdit = (index) => {
    const trimmed = editingText.trim();
    if (!trimmed) {
      handleRemoveSkill(index);
      return;
    }

    // Check if duplicate of any OTHER skill
    const isDuplicate = skills.some(
      (s, idx) => idx !== index && (typeof s === "string" ? s : s.name || "").toLowerCase() === trimmed.toLowerCase()
    );

    if (isDuplicate) {
      setDuplicateWarning(`"${trimmed}" already exists in your skills list.`);
      return;
    }

    if (onEdit) {
      onEdit(index, trimmed);
    } else {
      const updated = skills.map((s, idx) => (idx === index ? trimmed : s));
      onChange(updated);
    }

    setEditingIndex(null);
    setEditingText("");
    setDuplicateWarning(null);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center font-bold">
            <Wrench size={16} />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
              Skills & Technical Competencies
            </h3>
            <p className="text-[11px] text-slate-500">Add programming languages, frameworks, databases, and tools</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {onOpenGenerator && (
            <button
              type="button"
              onClick={() => onOpenGenerator("skills")}
              className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-bold rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition cursor-pointer"
              title="Organize skills into technical domains"
            >
              <Sparkles size={11} />
              <span>Organize with AI</span>
            </button>
          )}

          <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
            {skills.length} Added
          </span>
        </div>
      </div>

      {/* Input Row */}
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={skillInput}
            onChange={(e) => {
              setSkillInput(e.target.value);
              if (duplicateWarning) setDuplicateWarning(null);
            }}
            onKeyDown={handleKeyDown}
            placeholder="e.g. React.js, TypeScript, Node.js, PostgreSQL..."
            className="flex-1 text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
          <button
            type="button"
            onClick={handleAddSkill}
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold transition shadow-xs cursor-pointer"
          >
            <Plus size={14} />
            <span>Add</span>
          </button>
        </div>

        {duplicateWarning && (
          <div className="flex items-center gap-1.5 text-[11px] text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1.5 rounded-xl">
            <AlertCircle size={13} className="text-amber-600 shrink-0" />
            <span>{duplicateWarning}</span>
          </div>
        )}
      </div>

      {/* Skills Chips Container */}
      <div className="min-h-[52px] p-3 rounded-xl bg-slate-50/60 border border-slate-100 flex flex-wrap gap-1.5 items-center">
        {skills.length === 0 ? (
          <span className="text-xs text-slate-400 italic">
            No skills added yet. Type a skill above and press Enter or click Add.
          </span>
        ) : (
          skills.map((skill, idx) => {
            const skillName = typeof skill === "string" ? skill : skill.name || JSON.stringify(skill);
            const isEditingThis = editingIndex === idx;

            if (isEditingThis) {
              return (
                <div key={idx} className="inline-flex items-center gap-1 p-1 rounded-lg bg-blue-50 border border-blue-300">
                  <input
                    type="text"
                    value={editingText}
                    onChange={(e) => setEditingText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleSaveEdit(idx);
                      } else if (e.key === "Escape") {
                        setEditingIndex(null);
                      }
                    }}
                    autoFocus
                    className="text-xs px-2 py-0.5 rounded bg-white border border-blue-200 text-slate-900 focus:outline-none w-28"
                  />
                  <button
                    type="button"
                    onClick={() => handleSaveEdit(idx)}
                    className="p-1 text-emerald-600 hover:text-emerald-800 cursor-pointer"
                    title="Save edit"
                  >
                    <Check size={12} />
                  </button>
                  <button
                    type="button"
                    onClick={() => setEditingIndex(null)}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Cancel"
                  >
                    <X size={12} />
                  </button>
                </div>
              );
            }

            return (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-lg text-xs font-semibold bg-white text-slate-800 border border-slate-200 shadow-2xs group hover:border-slate-300 transition"
              >
                <span>{skillName}</span>
                <button
                  type="button"
                  onClick={() => handleStartEdit(idx, skill)}
                  className="text-slate-300 group-hover:text-slate-500 hover:text-blue-600 transition cursor-pointer p-0.5"
                  title="Edit skill"
                >
                  <Edit2 size={11} />
                </button>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(idx)}
                  className="text-slate-300 group-hover:text-slate-500 hover:text-red-500 transition cursor-pointer p-0.5 -mr-1"
                  title="Remove skill"
                >
                  <X size={12} />
                </button>
              </span>
            );
          })
        )}
      </div>
    </div>
  );
};

export default SkillsForm;
