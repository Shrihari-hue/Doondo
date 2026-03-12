import { CheckCircle2, TriangleAlert, X } from "lucide-react";

const toneClasses = {
  success: "border-teal/30 bg-[#0f2a24] text-teal",
  error: "border-coral/30 bg-[#2a1815] text-coral",
};

const icons = {
  success: <CheckCircle2 size={18} />,
  error: <TriangleAlert size={18} />,
};

const Toast = ({ tone = "success", message, onClose }) => {
  if (!message) {
    return null;
  }

  return (
    <div className={`fixed right-4 top-20 z-50 flex max-w-sm items-start gap-3 rounded-2xl border px-4 py-3 shadow-glow ${toneClasses[tone]}`}>
      <div className="mt-0.5">{icons[tone]}</div>
      <div className="flex-1 text-sm font-medium">{message}</div>
      <button type="button" onClick={onClose} className="opacity-70 transition hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
};

export default Toast;
