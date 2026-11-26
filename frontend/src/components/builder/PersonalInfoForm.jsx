import { User, Mail, Phone, MapPin, Link2, Globe, ExternalLink } from "lucide-react";

export const PersonalInfoForm = ({ data = {}, onChange, errors = {} }) => {
  const handleChange = (field, value) => {
    onChange({
      ...data,
      [field]: value
    });
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
      <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
        <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
          <User size={16} />
        </div>
        <div>
          <h3 className="text-xs font-bold uppercase tracking-wider text-slate-800">
            Personal Information
          </h3>
          <p className="text-[11px] text-slate-500">Contact details and profile links</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
        {/* Full Name */}
        <div className="space-y-1 sm:col-span-2">
          <label className="font-bold text-slate-700 flex items-center justify-between">
            <span>Full Name <span className="text-red-500">*</span></span>
          </label>
          <div className="relative">
            <input
              type="text"
              value={data.fullName || ""}
              onChange={(e) => handleChange("fullName", e.target.value)}
              placeholder="e.g. Harshil Undhad"
              className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                errors.fullName
                  ? "border-red-300 focus:ring-red-200 focus:border-red-500"
                  : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
              }`}
            />
          </div>
          {errors.fullName && <p className="text-[11px] text-red-600 font-medium">{errors.fullName}</p>}
        </div>

        {/* Email */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1">
            <Mail size={12} className="text-slate-400" />
            <span>Email Address <span className="text-red-500">*</span></span>
          </label>
          <input
            type="email"
            value={data.email || ""}
            onChange={(e) => handleChange("email", e.target.value)}
            placeholder="e.g. harshil@example.com"
            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
              errors.email
                ? "border-red-300 focus:ring-red-200 focus:border-red-500"
                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
          {errors.email && <p className="text-[11px] text-red-600 font-medium">{errors.email}</p>}
        </div>

        {/* Phone */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1">
            <Phone size={12} className="text-slate-400" />
            <span>Phone Number</span>
          </label>
          <input
            type="tel"
            value={data.phone || ""}
            onChange={(e) => handleChange("phone", e.target.value)}
            placeholder="e.g. +91 9876543210"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* Location */}
        <div className="space-y-1 sm:col-span-2">
          <label className="font-bold text-slate-700 flex items-center gap-1">
            <MapPin size={12} className="text-slate-400" />
            <span>Location / City, Country</span>
          </label>
          <input
            type="text"
            value={data.location || ""}
            onChange={(e) => handleChange("location", e.target.value)}
            placeholder="e.g. Ahmedabad, Gujarat, India"
            className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
          />
        </div>

        {/* LinkedIn */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1">
            <Link2 size={12} className="text-slate-400" />
            <span>LinkedIn Profile (Optional)</span>
          </label>
          <input
            type="url"
            value={data.linkedIn || ""}
            onChange={(e) => handleChange("linkedIn", e.target.value)}
            placeholder="e.g. linkedin.com/in/harshil"
            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
              errors.linkedIn
                ? "border-red-300 focus:ring-red-200 focus:border-red-500"
                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
          {errors.linkedIn && <p className="text-[11px] text-red-600 font-medium">{errors.linkedIn}</p>}
        </div>

        {/* GitHub */}
        <div className="space-y-1">
          <label className="font-bold text-slate-700 flex items-center gap-1">
            <ExternalLink size={12} className="text-slate-400" />
            <span>GitHub Profile (Optional)</span>
          </label>
          <input
            type="url"
            value={data.gitHub || ""}
            onChange={(e) => handleChange("gitHub", e.target.value)}
            placeholder="e.g. github.com/harshil"
            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
              errors.gitHub
                ? "border-red-300 focus:ring-red-200 focus:border-red-500"
                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
          {errors.gitHub && <p className="text-[11px] text-red-600 font-medium">{errors.gitHub}</p>}
        </div>

        {/* Portfolio */}
        <div className="space-y-1 sm:col-span-2">
          <label className="font-bold text-slate-700 flex items-center gap-1">
            <Globe size={12} className="text-slate-400" />
            <span>Portfolio / Personal Website (Optional)</span>
          </label>
          <input
            type="url"
            value={data.portfolio || ""}
            onChange={(e) => handleChange("portfolio", e.target.value)}
            placeholder="e.g. https://harshil.dev"
            className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
              errors.portfolio
                ? "border-red-300 focus:ring-red-200 focus:border-red-500"
                : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
            }`}
          />
          {errors.portfolio && <p className="text-[11px] text-red-600 font-medium">{errors.portfolio}</p>}
        </div>
      </div>
    </div>
  );
};

export default PersonalInfoForm;
