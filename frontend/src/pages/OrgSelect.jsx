import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useLocale } from "../context/LocaleContext";

export default function OrgSelect() {
  const [orgs, setOrgs] = useState([]);
  const [selectedOrg, setSelectedOrg] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t, locale, changeLanguage } = useLocale();

  const navigate = useNavigate();
  const API = "http://localhost:3000/api"; // Hardcoded API

  useEffect(() => {
    fetch(`${API}/organisations`)
      .then(res => {
        if (!res.ok) throw new Error(t("orgSelect.fetchError"));
        return res.json();
      })
      .then(data => {
        setOrgs(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(t("orgSelect.loadError"));
        setLoading(false);
      });
  }, []);

  const handleContinue = () => {
    if (!selectedOrg) return;
    navigate(`/${selectedOrg}/login`);
  };

  if (loading) return <p style={styles.message}>{t("orgSelect.loading")}</p>;
  if (error) return <p style={styles.message}>{error}</p>;

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
            <h1 style={{ margin: 0 }}>{t("orgSelect.header")}</h1>
            <button
              onClick={() => changeLanguage(locale === "en" ? "sv" : "en")}
              style={{ padding: "6px 12px" }}
            >
              {locale}
            </button>
        </div>
        <div style={styles.container}>
        <h2>{t("orgSelect.selectOrganisation")}</h2>

        <select
            value={selectedOrg}
            onChange={(e) => setSelectedOrg(e.target.value)}
            style={styles.select}
        >
            <option value="">{t("orgSelect.chooseOrganisation")}</option>
            {orgs.map(org => (
            <option key={org.orgId} value={org.orgId}>
                {org.orgName}
            </option>
            ))}
        </select>

        <button
            onClick={handleContinue}
            style={{ ...styles.button, opacity: selectedOrg ? 1 : 0.6 }}
            disabled={!selectedOrg}
        >
            {t("orgSelect.continue")}
        </button>
        </div>
    </>
  );
}

const styles = {
  container: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    marginTop: "100px",
    fontFamily: "Arial, sans-serif"
  },
  select: {
    padding: "10px",
    margin: "20px",
    width: "250px",
    fontSize: "16px"
  },
  button: {
    padding: "10px 20px",
    cursor: "pointer",
    fontSize: "16px",
    backgroundColor: "#1976d2",
    color: "#fff",
    border: "none",
    borderRadius: "4px"
  },
  message: {
    textAlign: "center",
    marginTop: "100px",
    fontSize: "18px"
  }
};