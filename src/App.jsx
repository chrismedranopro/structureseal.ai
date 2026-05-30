import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "./components/layout/Sidebar";
import CrmDashboard from "./pages/CrmDashboard";
import LeadsKanban from "./pages/LeadsKanban";
import QuoteAssistant from "./pages/QuoteAssistant";
import MissedCallRecovery from "./pages/MissedCallRecovery";
import Settings from "./pages/Settings";

export default function App() {
  return (
    <BrowserRouter>
      <AppLayout>
        <Routes>
          <Route path="/" element={<CrmDashboard />} />
          <Route path="/leads" element={<LeadsKanban />} />
          <Route path="/quotes" element={<QuoteAssistant />} />
          <Route path="/missed-calls" element={<MissedCallRecovery />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </AppLayout>
    </BrowserRouter>
  );
}
