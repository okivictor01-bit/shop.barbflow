import React, { useState } from "react";
import { supabase } from "../supabaseClient.js";
import TicketsTab from "./TicketsTab.jsx";
import ServicesTab from "./ServicesTab.jsx";
import PhotosTab from "./PhotosTab.jsx";
import SettingsTab from "./SettingsTab.jsx";

const TABS = [
  { id: "tickets", label: "Tickets" },
  { id: "services", label: "Services" },
  { id: "photos", label: "Photos" },
  { id: "settings", label: "Settings" },
];

export default function Dashboard({ shop, onShopUpdated }) {
  const [activeTab, setActiveTab] = useState("tickets");

  return (
    <div className="app-shell">
      <div className="topbar">
        <div className="brand">
          <span className="brand-mark">✂</span> BarbFlow
        </div>
        <div className="topbar-actions">
          <span>{shop.name}</span>
          <span className={`status-pill status-${shop.status}`}>{shop.status}</span>
          <button className="btn btn-ghost" onClick={() => supabase.auth.signOut()}>
            Sign out
          </button>
        </div>
      </div>

      <div className="container container-wide">
        {shop.status === "pending" && (
          <div className="card" style={{ marginBottom: 28 }}>
            <p style={{ margin: 0, color: "var(--parchment-200)" }}>
              Your shop is awaiting approval before it's visible in customer
              search. You can still set up services and photos in the
              meantime.
            </p>
          </div>
        )}

        <div className="tabs">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              className={`tab ${activeTab === tab.id ? "active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === "tickets" && <TicketsTab shop={shop} />}
        {activeTab === "services" && <ServicesTab shop={shop} />}
        {activeTab === "photos" && <PhotosTab shop={shop} />}
        {activeTab === "settings" && <SettingsTab shop={shop} onShopUpdated={onShopUpdated} />}
      </div>
    </div>
  );
}
