import React, { useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function ShopRegistration({ onRegistered }) {
  const referralCode = new URLSearchParams(window.location.search).get("ref");

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [city, setCity] = useState("");
  const [area, setArea] = useState("");
  const [address, setAddress] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: rpcError } = await supabase.rpc("register_shop", {
      p_name: name,
      p_city: city,
      p_area: area,
      p_description: description || null,
      p_address: address || null,
      p_phone: phone || null,
      p_referral_code: referralCode || null,
    });

    setSubmitting(false);

    if (rpcError) {
      setError(rpcError.message ?? "Could not register your shop. Try again.");
      return;
    }

    onRegistered();
  }

  return (
    <div className="auth-wrap">
      {referralCode && (
        <div className="referral-chip">Referred by code: {referralCode}</div>
      )}
      <div className="auth-eyebrow">One more step</div>
      <h1 className="auth-title">Register your shop</h1>
      <p className="auth-sub">
        This is what customers will see when they search for a shop near
        them. Your shop stays hidden from search until it's approved.
      </p>

      <form onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="name">Shop name</label>
          <input id="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        <div className="field">
          <label htmlFor="description">Description</label>
          <textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What makes your shop worth a visit?"
          />
        </div>

        <div className="grid-2">
          <div className="field">
            <label htmlFor="city">City</label>
            <input id="city" value={city} onChange={(e) => setCity(e.target.value)} required />
          </div>
          <div className="field">
            <label htmlFor="area">Area / neighborhood</label>
            <input id="area" value={area} onChange={(e) => setArea(e.target.value)} required />
          </div>
        </div>

        <div className="field">
          <label htmlFor="address">Street address</label>
          <input id="address" value={address} onChange={(e) => setAddress(e.target.value)} />
        </div>

        <div className="field">
          <label htmlFor="shopPhone">Shop phone</label>
          <input
            id="shopPhone"
            type="tel"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
          />
        </div>

        <button type="submit" className="btn btn-primary btn-block" disabled={submitting}>
          {submitting ? "Registering…" : "Register shop"}
        </button>

        {error && <p className="error-text">{error}</p>}
      </form>
    </div>
  );
}
