import { useState, useEffect } from "react";
import {
  Routes,
  Route,
  Navigate,
  useNavigate,
  useParams,
  useLocation,
} from "react-router-dom";
import "./App.css";
import { getSupabase, isEmail } from "./lib/supabase";
import { buildSignupMetadata, SELF_SERVICE_ROLES, toAuthenticatedUser } from "./lib/authSession";
import { SupabaseSessionProvider } from "./context/SupabaseSessionProvider";
import { useSupabaseSession } from "./context/useSupabaseSession";

// --- Auth & Core screens ---
import { Intro } from "./screens/public/Intro";
import { Login } from "./screens/Login";
import { Placeholder } from "./screens/Placeholder";
import { AdminApp } from "./screens/Admin/AdminApp";

// --- Dashboards owned by roles without custom flow state ---
import { TransporterDashboard } from "./screens/Transporter/pages/TransporterDashboard";
import { SlaughterhouseDashboard } from "./screens/Slaughterhouse/pages/SlaughterhouseDashboard";
import { ProcessorDashboard } from "./screens/Processor/pages/ProcessorDashboard";
import { ProcessorDataProvider } from "./screens/Processor/context/ProcessorDataContext";
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
import { BasicRoleSignup } from "./signup_screens/BasicRoleSignup";

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
  veterinary_officer: (props) => <BasicRoleSignup role="veterinary_officer" {...props} />,
};


const VALID_ROLES = new Set([
  ...Object.keys(DASHBOARDS),
  "farmer",
  "agent",
  "veterinary_officer",
]);


const ROLES_WITH_SETUP = ["transporter", "slaughterhouse"];

// --- Route Component Wrappers ---

function IntroRoute() {
  const navigate = useNavigate();

  const handlePickRole = (role) => {
    if (role.screen) {
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

  const handleSubmit = async (credentials) => {
    setLoginError("");
    try {
      const identifier = credentials.identifier.trim();
      const signInCredentials = isEmail(identifier)
        ? { email: identifier, password: credentials.password }
        : { phone: identifier, password: credentials.password };
      const { data, error } = await getSupabase().auth.signInWithPassword(signInCredentials);
      if (error) throw error;
      if (!data.user || !data.session) {
        throw new Error("Sign-in succeeded, but no active Supabase session was returned.");
      }

      const user = toAuthenticatedUser(data.user);
      if (user.role === "administrator" || user.role === "super_admin") {
        navigate("/admin", { replace: true });
        return;
      }
      if (user.role === "veterinary_officer") {
        navigate("/veterinary", { replace: true });
        return;
      }
      if (VALID_ROLES.has(user.role)) {
        navigate(`/dashboard/${user.role}`, { replace: true });
        return;
      }

      await getSupabase().auth.signOut();
      throw new Error("Your account does not have an approved BeefTrace role.");
    } catch (error) {
      setLoginError(error.message || "Unable to sign in. Please check your credentials.");
    }
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
  const [signupError, setSignupError] = useState("");
  const goIntro = () => navigate("/");
  const goLogin = () => navigate("/login");

  const handleSubmit = async (formData) => {
    setSignupError("");
    try {
      const signupRole = formData.role || role;
      if (!SELF_SERVICE_ROLES.has(signupRole)) {
        throw new Error("Choose a supported BeefTrace role before signing up.");
      }

      const metadata = buildSignupMetadata({ ...formData, role: signupRole });
      const { data, error } = await getSupabase().auth.signUp({
        // Dedicated signup screens collect an email. Phone remains metadata,
        // not the authentication identifier for signup.
        email: formData.email.trim(),
        password: formData.password,
        options: { data: metadata },
      });
      if (error) throw error;
      if (!data.user) {
        throw new Error("Account creation did not return a Supabase user.");
      }

      if (data.session) {
        if (signupRole === "veterinary_officer") {
          navigate("/veterinary", {
            replace: true,
            state: { fromVeterinarySignup: true },
          });
        } else if (ROLES_WITH_SETUP.includes(signupRole)) {
          navigate(`/dashboard/${signupRole}/setup`, { replace: true });
        } else {
          navigate(`/dashboard/${signupRole}`, { replace: true });
        }
      } else {
        navigate("/login", { replace: true });
      }
    } catch (error) {
      setSignupError(error.message || "Unable to create your account. Please try again.");
    }
  };

  const DedicatedSignup = SIGNUP_SCREENS[role];
  if (DedicatedSignup) {
    return (
      <>
        {signupError && (
          <div style={{ maxWidth: 760, margin: "16px auto 0", padding: "10px 12px", borderRadius: 8, background: "var(--rust-50, #fdf1ec)", color: "var(--rust-600)", fontSize: 13 }}>
            {signupError}
          </div>
        )}
        <DedicatedSignup
          onBack={goIntro}
          onSubmit={handleSubmit}
          onLogin={goLogin}
        />
      </>
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
  const { user: currentUser, checkingSession } = useSupabaseSession();

  if (checkingSession) {
    return <div style={{ padding: "80px 0", textAlign: "center" }}>Checking your session…</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  if (currentUser.role === "veterinary_officer") {
    return <Navigate to="/veterinary" replace />;
  }

  if (currentUser.role && currentUser.role !== role) {
    return <Navigate to={`/dashboard/${currentUser.role}`} replace />;
  }

  const handleLogout = async () => {
    try {
      await getSupabase().auth.signOut();
    } catch {
      // Clear local display state even if the browser has lost connectivity.
    }
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
      fullname={currentUser?.fullname || currentUser?.email || "there"}
      userName={currentUser?.fullname || currentUser?.email || "there"}
      onLogout={handleLogout}
      onToggleTheme={onToggleTheme}
    />
  );

  if (role === "distributor") {
    return (
      <DistributorDataProvider>{dashboardContent}</DistributorDataProvider>
    );
  }

  // ProcessorDashboard depends on ProcessorDataProvider context.
  if (role === 'processor') {
    return (
      <ProcessorDataProvider>
        {dashboardContent}
      </ProcessorDataProvider>
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
  const location = useLocation();
  const { user: currentUser, checkingSession } = useSupabaseSession();

  if (checkingSession) {
    return <div style={{ padding: "80px 0", textAlign: "center" }}>Checking your session…</div>;
  }

  if (!currentUser) {
    return <Navigate to="/login" replace />;
  }

  const fromVeterinarySignup = location.state?.fromVeterinarySignup === true;

  if (currentUser.role !== "veterinary_officer" && !fromVeterinarySignup) {
    return <Navigate to={`/dashboard/${currentUser.role || "farmer"}`} replace />;
  }

  const handleLogout = async () => {
    try {
      await getSupabase().auth.signOut();
    } catch {
      // Clear local display state even if the browser has lost connectivity.
    }
    navigate("/", { replace: true });
  };

  return (
    <VeterinaryRoutes
      fullname={currentUser.fullname || "Veterinary officer"}
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
      <SupabaseSessionProvider>
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
      </SupabaseSessionProvider>
  );
}

export default App;
