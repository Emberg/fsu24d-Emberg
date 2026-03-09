import { Routes, Route, Navigate, useParams } from "react-router-dom";
import OrgSelect from "./pages/OrgSelect.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Calendar from "./pages/Calendar.jsx";
import Admin from "./pages/Admin.jsx";

// Decode JWT safely
function getTokenData() {
  const token = localStorage.getItem("token");
  if (!token) return null;

  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return { token, orgId: payload.orgId };
  } catch {
    return null;
  }
}

function ProtectedOrgRoute({ children }) {
  const tokenData = getTokenData();
  const { orgId } = useParams();

  // Not logged in
  if (!tokenData) {
    return <Navigate to="/" replace />;
  }

  // Logged in but wrong org in URL
  if (orgId !== tokenData.orgId) {
    return (
      <Navigate
        to={`/${tokenData.orgId}/calendar`} replace
      />
    );
  }

  return children;
}

export default function App() {
  const tokenData = getTokenData();

  return (
    <Routes>
      {/* Root */}
      <Route
        path="/"
        element={
          tokenData
            ? <Navigate to={`/${tokenData.orgId}/calendar`} replace />
            : <OrgSelect />
        }
      />

      {/* Login */}
      <Route
        path="/:orgId/login"
        element={
          tokenData
            ? <Navigate to={`/${tokenData.orgId}/calendar`} replace />
            : <Login />
        }
      />

      {/* Register */}
      <Route
        path="/:orgId/register"
        element={
          tokenData
            ? <Navigate to={`/${tokenData.orgId}/calendar`} replace />
            : <Register />
        }
      />

      {/* Calendar (Protected + Org Validated) */}
      <Route
        path="/:orgId/calendar"
        element={
          <ProtectedOrgRoute>
            <Calendar />
          </ProtectedOrgRoute>
        }
      />

      <Route
        path="/:orgId/admin"
        element={
          <ProtectedOrgRoute>
            <Admin />
          </ProtectedOrgRoute>
        }
      />
    </Routes>
  );
}