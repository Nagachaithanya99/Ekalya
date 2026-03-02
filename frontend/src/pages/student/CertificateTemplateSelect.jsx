import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  getCertificateTemplatesFlow,
  selectCertificateTemplateFlow,
} from "../../services/courseLifecycleService";

export default function CertificateTemplateSelect() {
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [templates, setTemplates] = useState([]);
  const [selected, setSelected] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    getCertificateTemplatesFlow(courseId)
      .then((r) => {
        const list = Array.isArray(r.data) ? r.data : [];
        setTemplates(list);
        setSelected(list[0]?._id || "");
      })
      .catch((e) => {
        alert(e?.response?.data?.message || "Unable to load certificate templates");
        setTemplates([]);
        setSelected("");
      });
  }, [courseId]);

  const submit = async () => {
    if (!selected) return;
    setSaving(true);
    try {
      await selectCertificateTemplateFlow(courseId, selected);
      alert("Certificate request submitted. Please wait till admin approves your certificate.");
      navigate("/student/certificates");
    } catch (e) {
      alert(e?.response?.data?.message || "Unable to generate certificate");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">CertificateTemplateSelect</h1>
      {!templates.length ? (
        <div className="glass rounded-xl border border-white/10 p-4 text-white/70">
          No templates available right now. Ask admin to enable certificate templates.
        </div>
      ) : null}
      <div className="grid md:grid-cols-3 gap-3">
        {templates.map((t) => (
          <button
            key={t._id}
            onClick={() => setSelected(t._id)}
            className={`glass rounded-xl border p-3 text-left ${
              selected === t._id ? "border-[#f7d774]" : "border-white/10"
            }`}
          >
            <div className="font-bold">{t.name}</div>
            <div className="text-xs text-white/70">{t.key}</div>
          </button>
        ))}
      </div>
      <button className="btn-gold" onClick={submit} disabled={!selected || saving}>
        {saving ? "Generating..." : "Generate Certificate"}
      </button>
    </div>
  );
}
