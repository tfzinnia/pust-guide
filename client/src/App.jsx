import { BrowserRouter } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import AppRoutes from "./routes/AppRoutes";
import PortalProvider from "./context/PortalProvider";
import StudentAssistant from "./components/assistant/StudentAssistant";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <PortalProvider>
          <AppRoutes />
          <StudentAssistant />
        </PortalProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
