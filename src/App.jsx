import React, { useEffect, useState } from "react";
import { supabase } from "./supabaseClient.js";
import AuthScreen from "./pages/AuthScreen.jsx";
import ShopRegistration from "./pages/ShopRegistration.jsx";
import Dashboard from "./pages/Dashboard.jsx";

export default function App() {
  const [session, setSession] = useState(null);
  const [loadingSession, setLoadingSession] = useState(true);
  const [shop, setShop] = useState(null);
  const [loadingShop, setLoadingShop] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setSession(data.session);
      setLoadingSession(false);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((_event, newSession) => {
      setSession(newSession);
    });

    return () => listener.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!session) {
      setShop(null);
      return;
    }
    loadShop();
  }, [session]);

  async function loadShop() {
    setLoadingShop(true);
    const { data, error } = await supabase
      .from("shops")
      .select("*")
      .eq("owner_id", session.user.id)
      .maybeSingle();

    if (error) {
      console.error("Failed to load shop:", error);
    }
    setShop(data ?? null);
    setLoadingShop(false);
  }

  if (loadingSession) {
    return <CenteredMessage text="Loading…" />;
  }

  if (!session) {
    return <AuthScreen />;
  }

  if (loadingShop) {
    return <CenteredMessage text="Loading your shop…" />;
  }

  if (!shop) {
    return <ShopRegistration onRegistered={loadShop} />;
  }

  return <Dashboard shop={shop} onShopUpdated={loadShop} />;
}

function CenteredMessage({ text }) {
  return (
    <div className="app-shell">
      <div className="container" style={{ textAlign: "center", paddingTop: 120 }}>
        <p style={{ color: "var(--parchment-200)", opacity: 0.7 }}>{text}</p>
      </div>
    </div>
  );
}
