import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";

function getTokenData() {
  const token = localStorage.getItem("token");
  if (!token) return null;
  try {
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload;
  } catch {
    return null;
  }
}

function logout() {
  localStorage.removeItem("token");
  window.location.href = "/";
}

export default function Header() {  
  const { t, locale, changeLanguage } = useLocale();
  const navigate = useNavigate();

  const tokenData = getTokenData();
  const userEmail = tokenData?.email;
  const orgId = tokenData?.orgId;
  const userRole = tokenData?.role; // <-- extract role

  const goToFrontpage = () => {
    if (orgId) {
      navigate(`/${orgId}/calendar`);
    }
  };

  const goToAdmin = () => {
    if (orgId) {
      navigate(`/${orgId}/admin`);
    }
  };

  return(
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        marginBottom: 10,
        padding: "12px 20px",
        backgroundColor: "#006400",
        color: "#ffffff",
      }}
    >
      <h1
        onClick={goToFrontpage}
        style={{ margin: 0, cursor: "pointer" }}
      >
        {t("app.title")}
      </h1>

      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
        {userEmail && <span>{userEmail}</span>}

        {/* Show Admin button only if role is admin */}
        {userRole === "admin" && (
          <button
            onClick={goToAdmin}
            style={{ padding: "6px 12px" }}
          >
            Admin
          </button>
        )}

        <button onClick={logout} style={{ padding: "6px 12px" }}>
          {t("auth.logout")}
        </button>

        <button
          onClick={() => changeLanguage(locale === "en" ? "sv" : "en")}
          style={{ padding: "6px 12px" }}
        >
          {locale}
        </button>
      </div>
    </div>
  )
}