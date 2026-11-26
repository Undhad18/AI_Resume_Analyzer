import { Award } from "lucide-react";
import SectionCard from "./SectionCard";
import EntryCard from "./EntryCard";
import { isValidUrl } from "../../utils/resumeBuilderValidation";

export const CertificationsForm = ({
  certifications = [],
  onAdd,
  onUpdate,
  onDelete
}) => {
  return (
    <SectionCard
      icon={Award}
      iconBg="bg-amber-50 text-amber-600"
      title="Certifications"
      subtitle="Industry credentials, licenses, and verified accreditations"
      count={certifications.length}
      onAdd={onAdd}
      addLabel="Add Certification"
    >
      {certifications.length === 0 ? (
        <div className="p-6 text-center border border-dashed border-slate-200 rounded-xl space-y-2">
          <p className="text-xs text-slate-500">
            No certifications added yet. Click &quot;Add Certification&quot; to include credentials.
          </p>
        </div>
      ) : (
        certifications.map((cert, idx) => {
          const certTitle = cert.certificationName || cert.name || "Untitled Certification";
          const isUrlValid = isValidUrl(cert.credentialUrl);

          return (
            <EntryCard
              key={cert.id || idx}
              index={idx}
              total={certifications.length}
              title={certTitle}
              subtitle={cert.issuingOrganization || cert.issuer || "Issuing organization not specified"}
              onDelete={() => onDelete(cert.id)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                {/* Certification Name */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">
                    Certification Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    value={cert.certificationName || cert.name || ""}
                    onChange={(e) => {
                      onUpdate(cert.id, "certificationName", e.target.value);
                      onUpdate(cert.id, "name", e.target.value);
                    }}
                    placeholder="e.g. AWS Certified Solutions Architect - Associate"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Issuing Organization */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Issuing Organization</label>
                  <input
                    type="text"
                    value={cert.issuingOrganization || cert.issuer || ""}
                    onChange={(e) => {
                      onUpdate(cert.id, "issuingOrganization", e.target.value);
                      onUpdate(cert.id, "issuer", e.target.value);
                    }}
                    placeholder="e.g. Amazon Web Services"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Issue Date */}
                <div className="space-y-1">
                  <label className="font-bold text-slate-700">Issue Date / Year</label>
                  <input
                    type="text"
                    value={cert.issueDate || ""}
                    onChange={(e) => onUpdate(cert.id, "issueDate", e.target.value)}
                    placeholder="e.g. Nov 2023 or 2023"
                    className="w-full text-xs px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition"
                  />
                </div>

                {/* Credential URL */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="font-bold text-slate-700">Credential Verification URL (Optional)</label>
                  <input
                    type="url"
                    value={cert.credentialUrl || ""}
                    onChange={(e) => onUpdate(cert.id, "credentialUrl", e.target.value)}
                    placeholder="e.g. https://www.credly.com/badges/sample-id"
                    className={`w-full text-xs px-3.5 py-2.5 rounded-xl border bg-slate-50/60 text-slate-800 placeholder-slate-400 focus:bg-white focus:outline-none focus:ring-2 transition ${
                      !isUrlValid
                        ? "border-red-300 focus:ring-red-200 focus:border-red-500"
                        : "border-slate-200 focus:ring-blue-500/20 focus:border-blue-500"
                    }`}
                  />
                  {!isUrlValid && (
                    <p className="text-[11px] text-red-600 font-medium">Please enter a valid URL.</p>
                  )}
                </div>
              </div>
            </EntryCard>
          );
        })
      )}
    </SectionCard>
  );
};

export default CertificationsForm;
