import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";

const API = "http://localhost:3000/api";

export default function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { orgId } = useParams(); // Get orgId from URL
  const { t, locale, changeLanguage } = useLocale();

  const register = async () => {
    try {
      const res = await fetch(`${API}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, orgId })
      });

      if (res.ok) {
        alert(t("registerPage.successMessage"));
        navigate(`/${orgId}/login`);
      } else {
        const data = await res.json();
        alert(data.message || t("registerPage.failureMessage"));
      }
    } catch (err) {
      console.error(err);
      alert(t("registerPage.failureMessage"));
    }
  };

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          marginBottom: 10,
          padding: "12px 20px",
          backgroundColor: "#006400",
          color: "#ffffff"
        }}
      >
        <h1 style={{ margin: 0 }}>{t("registerPage.header")}</h1>
        <button
          onClick={() => changeLanguage(locale === "en" ? "sv" : "en")}
          style={{ padding: "6px 12px" }}
        >
          {locale}
        </button>
      </div>
      <div style={{ padding: 40, maxWidth: 400, margin: "auto" }}>
        <h1 style={{ textAlign: "center"}}>{t("registerPage.register")}</h1>
        <input
          placeholder={t("registerPage.email")}
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder={t("registerPage.password")}
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }}
        />
        <button onClick={register} style={{ width: "100%", padding: 10 }}>
          {t("registerPage.register")}
        </button>
        <button
          onClick={() => navigate(`/${orgId}/login`)}
          style={{ width: "100%", padding: 10, marginTop: 8 }}
        >
          {t("registerPage.goToLogin")}
        </button>
      </div>
    </>
  );
}