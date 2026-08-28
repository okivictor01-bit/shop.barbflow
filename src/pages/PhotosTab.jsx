import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient.js";

export default function PhotosTab({ shop }) {
  const [photos, setPhotos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [url, setUrl] = useState("");
  const [error, setError] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    loadPhotos();
  }, []);

  async function loadPhotos() {
    setLoading(true);
    const { data, error } = await supabase
      .from("shop_photos")
      .select("*")
      .eq("shop_id", shop.id)
      .order("position", { ascending: true });
    if (error) console.error("Failed to load photos:", error);
    setPhotos(data ?? []);
    setLoading(false);
  }

  async function handleAdd(e) {
    e.preventDefault();
    setError(null);
    setSubmitting(true);

    const { error: insertError } = await supabase.from("shop_photos").insert({
      shop_id: shop.id,
      url,
      position: photos.length,
    });

    setSubmitting(false);

    if (insertError) {
      setError(insertError.message ?? "Could not add photo.");
      return;
    }

    setUrl("");
    loadPhotos();
  }

  async function handleRemove(photoId) {
    await supabase.from("shop_photos").delete().eq("id", photoId);
    loadPhotos();
  }

  return (
    <div>
      <div className="section-header">
        <h2 className="section-title">Shop photos</h2>
      </div>

      <div className="card" style={{ marginBottom: 24 }}>
        <p className="card-sub" style={{ marginBottom: 14 }}>
          Paste a link to an image (interior, exterior, your team at work).
          Real photos make a much bigger difference than a blank listing.
        </p>
        <form onSubmit={handleAdd} style={{ display: "flex", gap: 10 }}>
          <input
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="https://…"
            type="url"
            required
            style={{
              flex: 1,
              padding: "11px 13px",
              borderRadius: 8,
              border: "1px solid var(--charcoal-700)",
              background: "var(--charcoal-900)",
              color: "var(--parchment-100)",
            }}
          />
          <button type="submit" className="btn btn-primary" disabled={submitting}>
            {submitting ? "Adding…" : "Add"}
          </button>
        </form>
        {error && <p className="error-text">{error}</p>}
      </div>

      {loading ? (
        <p style={{ color: "var(--parchment-200)", opacity: 0.6 }}>Loading photos…</p>
      ) : photos.length === 0 ? (
        <div className="empty-state">
          <h3>No photos yet</h3>
          <p>Add a few to help customers picture the place before they book.</p>
        </div>
      ) : (
        <div className="grid-2">
          {photos.map((photo) => (
            <div className="card" key={photo.id} style={{ padding: 10 }}>
              <img
                src={photo.url}
                alt=""
                style={{
                  width: "100%",
                  height: 160,
                  objectFit: "cover",
                  borderRadius: 8,
                  marginBottom: 10,
                }}
                onError={(e) => (e.target.style.opacity = 0.2)}
              />
              <button className="btn btn-danger btn-block" onClick={() => handleRemove(photo.id)}>
                Remove
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
