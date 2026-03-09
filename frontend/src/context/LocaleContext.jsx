import React, {
    createContext,
    useContext,
    useState,
    useEffect,
    useCallback,
  } from "react";
  
  const LocaleContext = createContext(null);
  const API = process.env.API;
  
  const DEFAULT_LANGUAGE = "sv";
  const CACHE_TTL = 1000 * 60 * 60; // 1 hour
  
  export const LocaleProvider = ({ children }) => {
    const [locale, setLocale] = useState(
      localStorage.getItem("app-language") || DEFAULT_LANGUAGE
    );
    const [translations, setTranslations] = useState({});
    const [loading, setLoading] = useState(true);
  
    /**
     * Load translations from cache if valid
     */
    const loadFromCache = (lang) => {
      const cached = localStorage.getItem(`locale-${lang}`);
      if (!cached) return null;
  
      try {
        const parsed = JSON.parse(cached);
  
        const isExpired = Date.now() - parsed.timestamp > CACHE_TTL;
        if (isExpired) {
          localStorage.removeItem(`locale-${lang}`);
          return null;
        }
  
        return parsed.data;
      } catch {
        return null;
      }
    };
  
    /**
     * Save translations to cache
     */
    const saveToCache = (lang, data) => {
      localStorage.setItem(
        `locale-${lang}`,
        JSON.stringify({
          timestamp: Date.now(),
          data,
        })
      );
    };
  
    /**
     * Fetch translations from backend
     */
    const fetchTranslations = useCallback(async (lang) => {
      setLoading(true);
  
      const cached = loadFromCache(lang);
      if (cached) {
        setTranslations(cached);
        setLoading(false);
        return;
      }
  
      try {
        const response = await fetch(`${API}/locales/${lang}`);
  
        if (!response.ok) {
          throw new Error("Failed to fetch translations");
        }
  
        const data = await response.json();
  
        setTranslations(data);
        saveToCache(lang, data);
      } catch (error) {
        console.error("Translation load error:", error);
  
        // Fallback to default language if not already using it
        if (lang !== DEFAULT_LANGUAGE) {
          fetchTranslations(DEFAULT_LANGUAGE);
        }
      } finally {
        setLoading(false);
      }
    }, []);
  
    /**
     * Change language
     */
    const changeLanguage = (lang) => {
      localStorage.setItem("app-language", lang);
      setLocale(lang);
    };
  
    /**
     * Translation function
     * Supports:
     * - nested keys: "home.title"
     * - interpolation: {{name}}
     */
    const t = useCallback(
      (key, variables = {}) => {
        if (!translations) return key;
  
        const value = key
          .split(".")
          .reduce((obj, i) => obj?.[i], translations);
  
        if (!value) return null;
  
        let text = value;
  
        Object.keys(variables).forEach((varKey) => {
          text = text.replace(
            new RegExp(`{{\\s*${varKey}\\s*}}`, "g"),
            variables[varKey]
          );
        });
  
        return text;
      },
      [translations]
    );
  
    /**
     * Load translations when locale changes
     */
    useEffect(() => {
      fetchTranslations(locale);
    }, [locale, fetchTranslations]);
  
    return (
      <LocaleContext.Provider
        value={{
          t,
          locale,
          changeLanguage,
          loading,
        }}
      >
        {children}
      </LocaleContext.Provider>
    );
  };
  
  export const useLocale = () => {
    const context = useContext(LocaleContext);
    if (!context) {
      throw new Error("useLocale must be used within LocaleProvider");
    }
    return context;
  };