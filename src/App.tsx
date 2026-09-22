import { HashRouter, Routes, Route } from "react-router-dom";
import Shell from "./components/Shell";
import AuthGate from "./components/AuthGate";
import { ThemeProvider } from "./lib/ThemeContext";
import CommandCentre from "./pages/CommandCentre";
import Restaurants from "./pages/Restaurants";
import RestaurantDetail from "./pages/RestaurantDetail";
import Pipeline from "./pages/Pipeline";
import AgentHub from "./pages/AgentHub";
import AgentDetail from "./pages/AgentDetail";
import RestaurantLocator from "./pages/RestaurantLocator";
import Approvals from "./pages/Approvals";
import Tasks from "./pages/Tasks";
import Reports from "./pages/Reports";
import ReportPrint from "./pages/ReportPrint";
import Settings from "./pages/Settings";
import AdminAccess from "./pages/AdminAccess";

export default function App() {
  return (
    <ThemeProvider>
      <AuthGate>
        <HashRouter>
          <Shell>
            <Routes>
              <Route path="/" element={<CommandCentre />} />
              <Route path="/restaurants" element={<Restaurants />} />
              <Route path="/restaurants/:id" element={<RestaurantDetail />} />
              <Route path="/pipeline" element={<Pipeline />} />
              <Route path="/agents" element={<AgentHub />} />
              <Route path="/agents/:id" element={<AgentDetail />} />
              <Route path="/locator" element={<RestaurantLocator />} />
              <Route path="/approvals" element={<Approvals />} />
              <Route path="/tasks" element={<Tasks />} />
              <Route path="/reports" element={<Reports />} />
              <Route path="/reports/print" element={<ReportPrint />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="/admin/access" element={<AdminAccess />} />
            </Routes>
          </Shell>
        </HashRouter>
      </AuthGate>
    </ThemeProvider>
  );
}
