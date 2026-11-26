/**
 * Finding Importance / Impact Badge
 * Renders standardized priority tags for findings
 */
export const FindingImportance = ({ level = "medium", labelPrefix = "" }) => {
  const norm = String(level).toLowerCase();

  let colorClasses = "bg-slate-100 text-slate-700 border-slate-200";
  if (norm === "high") {
    colorClasses = "bg-rose-50 text-rose-700 border-rose-200 font-bold";
  } else if (norm === "medium") {
    colorClasses = "bg-amber-50 text-amber-700 border-amber-200 font-medium";
  } else if (norm === "low") {
    colorClasses = "bg-sky-50 text-sky-700 border-sky-200";
  }

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-[10px] uppercase tracking-wider border ${colorClasses}`}>
      {labelPrefix ? `${labelPrefix}: ` : ""}{norm}
    </span>
  );
};

export default FindingImportance;
