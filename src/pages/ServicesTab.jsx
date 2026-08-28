import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function ServicesTab({ shop }) {
  const [services, setServices] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [duration, setDuration] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadServices();
  }, []);

  async function loadServices() {
    setLoading(true);
    const { data, error } = await supabase
      .from("services")
      .select("*")
      .eq("shop_id", shop.id)
      .order("created_at", { ascending: true });
    if (error) console.error("Failed to load services:", error);
    setServices(data ?? []);
    setLoading(false);
  }

  function resetForm() {
    setEditingId(null);
    setName("");
    setDescription("");
    setPrice("");
    setDuration("");
    setError(null);
    setShowForm(false);
  }

  function startEdit(service) {
    setEditingId(service.id);
    setName(service.name);
    setDescription(service.description || "");
    setPrice(String(service.price));
    setDuration(service.duration_minutes ? String(service.duration_minutes) : "");
    setShowForm(true);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const payload = {
      shop_id: shop.id,
      name,
      description: description || null,
      price: Number(price),
      duration_minutes: duration ? Number(duration) : null,
    };

    const { error: saveError } = editingId
      ? await supabase.from("services").update(payload).eq("id", editingId)
      : await supabase.from("services").insert(payload);

    setSubmitting(false);

    if (saveError) {
      setError(saveError.message ?? "Could not save service.");
      return;
    }

    resetForm();
    loadServices();
  }

  async function toggleActive(service) {
    await supabase
      .from("services")
      .update({ is_active: !service.is_active })
      .eq("id", service.id);
    loadServices();
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Services & prices</h2>
        {!showForm && (
          <button className="btn btn-primary" onClick={() => setShowForm(true)}>
            Add service
          </button>
        )}
      </div>

      {showForm && (
        <div className="card">
          <form onSubmit={handleSubmit}>
            <div className="field">
              <label htmlFor="serviceName">Name</label>
              <input
                id="serviceName"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Classic taper"
                required
              />
            </div>
            <div className="field">
              <label htmlFor="serviceDescription">Description</label>
              <textarea
                id="serviceDescription"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="What's included, finish, style notes…"
              />
            </div>
            <div className="grid-2">
              <div className="field">
                <label htmlFor="servicePrice">Price (₦)</label>
                <input
                  id="servicePrice"
                  type="number"
                  min="0"
                  step="0.01"
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  required
                />
              </div>
              <div className="field">
                <label htmlFor="serviceDuration">Duration (minutes)</label>
                <input
                  id="serviceDuration"
                  type="number"
                  min="0"
                  value={duration}
                  onChange={(e) => setDuration(e.target.value)}
                  placeholder="Optional"
                />
              </div>
            </div>
            <div style={{ display: "flex", gap: 10 }}>
              <button type="submit" className="btn btn-primary" disabled={submitting}>
                {submitting ? "Saving…" : editingId ? "Save changes" : "Add service"}
              </button>
              <button type="button" className="btn btn-ghost" onClick={resetForm}>
                Cancel
              </button>
            </div>
            {error && <p className="error-text">{error}</p>}
          </form>
        </div>
      )}

      {loading ? (
        <p style={{ color: "var(--parchment-200)", opacity: 0.6 }}>Loading services…</p>
      ) : services.length === 0 && !showForm ? (
        <div className="empty-state">
          <h3>No services yet</h3>
          <p>Add your first service so customers know what to book.</p>
        </div>
      ) : (
        services.map((service) => (
          <div className="card" key={service.id}>
            <div className="card-row">
              <div>
                <div className="card-title">
                  {service.name}{" "}
                  {!service.is_active && (
                    <span className="status-pill status-suspended">Hidden</span>
                  )}
                </div>
                {service.description && <div className="card-sub">{service.description}</div>}
                {service.duration_minutes && (
                  <div className="card-sub">{service.duration_minutes} min</div>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                <span className="price-tag">₦{Number(service.price).toLocaleString()}</span>
                <button className="btn btn-ghost" onClick={() => startEdit(service)}>
                  Edit
                </button>
                <button className="btn btn-ghost" onClick={() => toggleActive(service)}>
                  {service.is_active ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
