import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
export default function PageHeader({
  title,
  subtitle,
  children,
  back = false,
}) {
  const navigate = useNavigate();
  return (
    <header className="gradient-blue-green px-6 pb-8 pt-7 text-white">
      {back && (
        <button
          className="mb-5 flex items-center gap-2"
          onClick={() => navigate(-1)}
        >
          <ArrowLeft size={18} />
          Back
        </button>
      )}
      <h1 className="text-2xl font-bold">{title}</h1>
      {subtitle && <p className="mt-2 text-sm text-white/90">{subtitle}</p>}
      {children}
    </header>
  );
}
