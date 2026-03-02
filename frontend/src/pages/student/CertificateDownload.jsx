import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { downloadCertificateFlow } from "../../services/courseLifecycleService";

export default function CertificateDownload() {
  const { courseId } = useParams();
  const [data, setData] = useState(null);

  useEffect(() => {
    downloadCertificateFlow(courseId)
      .then((r) => setData(r.data))
      .catch((e) => alert(e?.response?.data?.message || "Certificate not available"));
  }, [courseId]);

  if (!data) return <div className="text-white/60">Loading certificate...</div>;

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-extrabold">CertificateDownload</h1>
      <div className="glass rounded-2xl border border-white/10 p-5 space-y-2">
        <p>Certificate No: {data.certNo}</p>
        <p>Issued On: {new Date(data.issuedAt).toLocaleString()}</p>
        <a href={data.pdfUrl} target="_blank" rel="noreferrer" className="btn-gold inline-block">
          Download PDF
        </a>
      </div>
    </div>
  );
}
