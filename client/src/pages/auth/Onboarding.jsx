import { Bell, Map, ShieldCheck } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const slides = [
  {
    title: "Explore Campus",
    text: "Interactive campus map with all buildings, departments, halls, and important locations at your fingertips.",
    icon: Map,
    color: "text-blue-600",
    bg: "bg-blue-100",
  },
  {
    title: "Stay Updated",
    text: "Get instant notifications for circulars, notices, exam routines, and important announcements.",
    icon: Bell,
    color: "text-green-600",
    bg: "bg-green-100",
  },
  {
    title: "Safe Campus",
    text: "Report complaints anonymously, access emergency contacts, and learn about anti-ragging policies.",
    icon: ShieldCheck,
    color: "text-purple-600",
    bg: "bg-purple-100",
  },
];

export default function Onboarding() {
  const [index, setIndex] = useState(0);
  const navigate = useNavigate();

  const slide = slides[index];
  const Icon = slide.icon;

  function next() {
    if (index === slides.length - 1) {
      navigate("/login");
    } else {
      setIndex(index + 1);
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 px-6 py-6">
      <div className="flex flex-1 flex-col items-center justify-center text-center">
        <div
          className={`mb-8 flex h-52 w-52 items-center justify-center rounded-full ${slide.bg} ${slide.color}`}
        >
          <Icon size={96} />
        </div>

        <h1 className="text-3xl font-bold text-slate-900">{slide.title}</h1>
        <p className="mt-5 max-w-md text-lg leading-8 text-slate-500">
          {slide.text}
        </p>
      </div>

      <div className="mb-5 flex justify-center gap-2">
        {slides.map((_, i) => (
          <span
            key={i}
            className={`h-2 rounded-full ${
              i === index ? "w-8 bg-blue-600" : "w-2 bg-slate-300"
            }`}
          />
        ))}
      </div>

      <div className="grid grid-cols-2 gap-3">
        {index !== slides.length - 1 && (
          <button
            onClick={() => navigate("/login")}
            className="rounded-xl border border-slate-300 bg-white py-3 font-semibold"
          >
            Skip
          </button>
        )}

        <button
          onClick={next}
          className={`rounded-xl bg-blue-600 py-3 font-semibold text-white ${
            index === slides.length - 1 ? "col-span-2" : ""
          }`}
        >
          {index === slides.length - 1 ? "Get Started" : "Next"}
        </button>
      </div>
    </div>
  );
}
