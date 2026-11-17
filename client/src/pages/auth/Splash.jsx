import { GraduationCap } from "lucide-react";
import { useEffect } from "react";
import { useNavigate } from "react-router-dom";

export default function Splash() {
  const navigate = useNavigate();

  useEffect(() => {
    const timer = setTimeout(() => {
      navigate("/onboarding");
    }, 1500);

    return () => clearTimeout(timer);
  }, [navigate]);

  return (
    <div className="gradient-blue-green flex min-h-screen items-center justify-center text-white">
      <div className="text-center">
        <div className="mx-auto mb-8 flex h-36 w-36 items-center justify-center rounded-full bg-white/15">
          <GraduationCap size={72} />
        </div>

        <h1 className="text-4xl font-bold">PUST Guide</h1>
        <p className="mt-4 text-lg">Your smart campus companion</p>

        <div className="mt-12 flex justify-center gap-2">
          <span className="h-2 w-2 rounded-full bg-white/50" />
          <span className="h-2 w-2 rounded-full bg-white/50" />
          <span className="h-2 w-2 rounded-full bg-white/50" />
        </div>
      </div>
    </div>
  );
}
