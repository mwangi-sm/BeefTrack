import { useState, useEffect } from "react";
import {
  
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
} from "react-router-dom";
import "./App.css";
import {
  registerMockUser,
  setCurrentMockUser,
  getCurrentMockUser,
  clearCurrentMockUser,
} from "./lib/mockAuth";

// --- Auth & Core screens ---
import { Intro } from "./screens/public/Intro";
import { Login } from "./screens/Login";
import { Placeholder } from "./screens/Placeholder";
import { AdminApp } from "./screens/Admin/AdminApp";

// --- Dashboards owned by roles without custom flow state ---
import { TransporterDashboard } from "./screens/Transporter/pages/TransporterDashboard";
import { SlaughterhouseDashboard } from "./screens/Slaughterhouse/pages/SlaughterhouseDashboard";
import { ProcessorDashboard } from "./screens/Processor/ProcessorDashboard";
import { DistributorDashboard } from "./screens/Distributor/pages/DistributorDashboard";
import { DistributorDataProvider } from "./screens/Distributor/context/DistributorDataContext";
import { RetailerDashboard } from "./screens/Retailer/RetailerDashboard";
import { ConsumerDashboard } from "./screens/ConsumerDashboard";

// --- Signup screens (one per role) ---
import { FarmerSignup } from "./signup_screens/FarmerSignup";
import { AgentSignup } from "./signup_screens/AgentSignup";
import { TransporterSignup } from "./signup_screens/TransporterSignup";
import { SlaughterhouseSignup } from "./signup_screens/SlaughterhouseSignup";
import { ProcessorSignup } from "./signup_screens/ProcessorSignup";
import { DistributorSignup } from "./signup_screens/DistributorSignup";
import { RetailerSignup } from "./signup_screens/RetailerSignup";
import { ConsumerSignup } from "./signup_screens/ConsumerSignup";

// --- Farmer / Agent flow-hook route trees, and Veterinary ---
import { useFarmerFlow } from "./screens/farmer/services/useFarmerFlow";
import { FarmerRoutes } from "./screens/farmer/pages/FarmerRoutes";
import { useAgentFlow } from "./screens/agent/services/useAgentFlow";
import { AgentRoutes } from "./screens/agent/pages/AgentRoutes";
import { VeterinaryRoutes } from "./screens/veterinary/pages/VeterinaryRoutes";


const DASHBOARDS = {
  transporter: TransporterDashboard,
  slaughterhouse: SlaughterhouseDashboard,
  processor: ProcessorDashboard,
  distributor: DistributorDashboard,
  retailer: RetailerDashboard,
  consumer: ConsumerDashboard,
};

const SIGNUP_SCREENS = {
  farmer: FarmerSignup,
  agent: AgentSignup,
  transporter: TransporterSignup,
  slaughterhouse: SlaughterhouseSignup,
  processor: ProcessorSignup,
  distributor: DistributorSignup,
  retailer: RetailerSignup,
  consumer: ConsumerSignup,
};


const VALID_ROLES = new Set([
  ...Object.keys(DASHBOARDS),
  "farmer",
  "agent",
]);


const ROLES_WITH_SETUP = ["transporter", "slaughterhouse"];

// --- Route Component Wrappers ---

function IntroRoute() {
  const navigate = useNavigate();

  const handlePickRole = (role) => {
    if (role.screen === "veterinary") {
    
      navigate("/veterinary");
    } else if (role.screen) {
      navigate(`/signup/${role.screen}`);
    } else {
      navigate(`/placeholder/${encodeURIComponent(role.name)}`);
    }
  };

  const handleLogin = () => {
    navigate("/login");
  };

  return <Intro onPickRole={handlePickRole} onLogin={handleLogin} />;
}

function LoginRoute() {
  const navigate = useNavigate();
  const [loginError, setLoginError] = useState("");

  const handleSubmit = (credentials) => {
    const user = setCurrentMockUser(credentials.identifier);

    if (user && VALID_ROLES.has(user.role)) {
      navigate(`/dashboard/${user.role}`, { replace: true });
      return;
    }

    setLoginError(
      "We couldn't find an account with that email or phone number.",
    );
  };

  return (
    <Login
      onBack={() => navigate("/")}
      onSubmit={handleSubmit}
      onSignup={() => navigate("/")}
      error={loginError}
    />
  );
}

function SignupRoute() {
  const { role } = useParams();
  const navigate = useNavigate();
  const goIntro = () => navigate("/");
  const goLogin = () => navigate("/login");

  const handleSubmit = (formData) => {
    const fullname =
      formData.fullName ||
      [
        formData.firstName || formData.contactFirstName,
        formData.lastName || formData.contactLastName,
      ]
        .filter(Boolean)
        .join(" ");

    registerMockUser({
      email: formData.email,
      phone: formData.phone,
      role,
      fullname,
      accountType: formData.accountType,
    });
    setCurrentMockUser(formData.email || formData.phone);

    if (ROLES_WITH_SETUP.includes(role)) {
      navigate(`/dashboard/${role}/setup`, { replace: true });
    } else {
      navigate(`/dashboard/${role}`, { replace: true });
    }
  };

  const DedicatedSignup = SIGNUP_SCREENS[role];
  if (DedicatedSignup) {
    return (
      <DedicatedSignup
        onBack={goIntro}
        onSubmit={handleSubmit}
        onLogin={goLogin}
      />
    );
  }
  return <Navigate to="/" replace />;
}

function PlaceholderRoute() {
  const { roleName } = useParams();
  const navigate = useNavigate();
  return (
    <Placeholder
      roleName={decodeURIComponent(roleName)}
      onBack={() => navigate("/")}
    />
  );
}

function DashboardRoute({ onToggleTheme, farmerFlow, agentFlow }) {
  const { role } = useParams();
  const navigate = useNavigate();
  const currentUser = getCurrentMockUser();

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const handleLogout = () => {
    clearCurrentMockUser();
    navigate("/", { replace: true });
  };

  if (role === "farmer") {
    return (
      <FarmerRoutes
        flow={farmerFlow}
        user={currentUser}
        fullname={currentUser?.fullname || "there"}
        onLogout={handleLogout}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  if (role === "agent") {
    return (
      <AgentRoutes
        flow={agentFlow}
        user={currentUser}
        fullname={currentUser?.fullname || "there"}
        onLogout={handleLogout}
        onToggleTheme={onToggleTheme}
      />
    );
  }

  const Dashboard = DASHBOARDS[role];
  if (!Dashboard) return <Navigate to="/" replace />;

  const dashboardContent = (
    <Dashboard
      user={currentUser}
      fullname={currentUser?.fullname || "there"}
      onLogout={handleLogout}
      onToggleTheme={onToggleTheme}
    />
  );

  if (role === "distributor") {
    return (
      <DistributorDataProvider>{dashboardContent}</DistributorDataProvider>
    );
  }

  return dashboardContent;
}


function VeterinaryRoute({
  onToggleTheme,
  farmerFlow,
  traceabilityHistory,
  onRecordTraceabilityLookup,
}) {
  const navigate = useNavigate();

  const handleLogout = () => {
    clearCurrentMockUser();
    navigate("/", { replace: true });
  };

  return (
    <VeterinaryRoutes
      onLogout={handleLogout}
      onToggleTheme={onToggleTheme}
      flow={farmerFlow}
      traceabilityHistory={traceabilityHistory}
      onRecordTraceabilityLookup={onRecordTraceabilityLookup}
    />
  );
}

// --- Main App Component ---

function App() {
  const [theme, setTheme] = useState("light");

  const farmerFlow = useFarmerFlow("/dashboard/farmer");
  const agentFlow = useAgentFlow("/dashboard/agent");
  const [veterinaryTraceabilityHistory, setVeterinaryTraceabilityHistory] =
    useState([]);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
  }, [theme]);

  const toggleTheme = () =>
    setTheme((t) => (t === "light" ? "dark" : "light"));

  const recordVeterinaryTraceabilityLookup = (value) => {
    setVeterinaryTraceabilityHistory((prev) => [
      ...prev,
      { value, timestamp: new Date().toLocaleString() },
    ]);
  };

  return (
    
      <Routes>
        <Route path="/" element={<IntroRoute />} />
        <Route path="/login" element={<LoginRoute />} />
        <Route path="/signup/:role" element={<SignupRoute />} />
        <Route path="/placeholder/:roleName" element={<PlaceholderRoute />} />

        <Route path="/admin/*" element={<AdminApp onToggleTheme={toggleTheme} />} />

        <Route
          path="/dashboard/:role/*"
          element={
            <DashboardRoute
              onToggleTheme={toggleTheme}
              farmerFlow={farmerFlow}
              agentFlow={agentFlow}
            />
          }
        />

        <Route
          path="/veterinary/*"
          element={
            <VeterinaryRoute
              onToggleTheme={toggleTheme}
              farmerFlow={farmerFlow}
              traceabilityHistory={veterinaryTraceabilityHistory}
              onRecordTraceabilityLookup={recordVeterinaryTraceabilityLookup}
            />
          }
        />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    
  );
}

export default App;