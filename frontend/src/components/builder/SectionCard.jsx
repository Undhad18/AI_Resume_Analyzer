import { Plus } from "lucide-react";

export const SectionCard = ({
  icon: Icon,
  iconBg = "bg-blue-50 text-blue-600",
  title,
  subtitle,
  count = 0,
  onAdd,
  addLabel = "Add Item",
  children
}) => {
  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-3">
        <div className="flex items-center gap-2.5">
          {Icon && (
            <div className={`w-8 h-8 rounded-xl ${iconBg} flex items-center justify-center font-bold shrink-0`}>
              <Icon size={16} />
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
                {title}
              </h3>
              {typeof count === "number" && (
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600">
                  {count}
                </span>
              )}
            </div>
            {subtitle && <p className="text-[11px] text-slate-500">{subtitle}</p>}
          </div>
        </div>

        {onAdd && (
          <button
            type="button"
            onClick={onAdd}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 active:bg-slate-950 text-white text-xs font-bold transition shadow-xs cursor-pointer self-start sm:self-auto shrink-0"
          >
            <Plus size={13} />
            <span>{addLabel}</span>
          </button>
        )}
      </div>

      {/* Content */}
      <div className="space-y-3">{children}</div>
    </div>
  );
};

export default SectionCard;
