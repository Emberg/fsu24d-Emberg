import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";

const API = import.meta.env.VITE_API_URL;

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const { orgId } = useParams(); // Get orgId from URL
  const { t, locale, changeLanguage } = useLocale();

  const login = async () => {
    try {
      const res = await fetch(`${API}/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password, orgId })
      });

      const data = await res.json();

      if (data.token) {
        localStorage.setItem("token", data.token);
        navigate(`/${orgId}/calendar`);
      } else {
        alert(data.message || t("loginPage.loginFailed"));
      }
    } catch (err) {
      console.error(err);
      alert(t("loginPage.loginFailed"));
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
        <h1 style={{ margin: 0 }}>{t("loginPage.header")}</h1>
        <button
          onClick={() => changeLanguage(locale === "en" ? "sv" : "en")}
          style={{ padding: "6px 12px" }}
        >
          {locale}
        </button>
      </div>
      <div style={{ padding: 40, maxWidth: 400, margin: "auto" }}>
        <h1 style={{ textAlign: "center" }}>{t("loginPage.login")}</h1>
        <input
          placeholder={t("loginPage.email")}
          value={email}
          onChange={e => setEmail(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }}
        />
        <input
          type="password"
          placeholder={t("loginPage.password")}
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: "100%", padding: 8, marginBottom: 8, boxSizing: "border-box" }}
        />
        <button onClick={login} style={{ width: "100%", padding: 10 }}>
          {t("loginPage.login")}
        </button>
        <button
          onClick={() => navigate(`/${orgId}/register`)}
          style={{ width: "100%", padding: 10, marginTop: 8 }}
        >
          {t("loginPage.goToRegister")}
        </button>
      </div>
    </>
  );
}