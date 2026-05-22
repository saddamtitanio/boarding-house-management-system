"use client";

import { useState, useEffect } from "react";
import "./settings.css";

export default function SettingsPage() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Load current user profile details
  useEffect(() => {
    async function loadProfile() {
      try {
        const res = await fetch("/api/profile");
        const data = await res.json();
        if (data.success && data.data) {
          setFirstName(data.data.first_name || "");
          setLastName(data.data.last_name || "");
          setPhone(data.data.phone || "");
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Update profile details on form submit
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage(null);

    try {
      const res = await fetch("/api/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone: phone,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: "Profile details updated successfully." });
      } else {
        setMessage({ type: "error", text: data.error || "Failed to update profile details." });
      }
    } catch (err) {
      console.error("Error updating profile details", err);
      setMessage({ type: "error", text: "Failed to connect to the server." });
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="settings-layout" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
        <p style={{ color: "#8B6F5E" }}>Loading settings...</p>
      </div>
    );
  }

  return (
    <div className="settings-layout">
      {/* Page Header */}
      <div className="settings-header">
        <h1 className="settings-title">Account Settings</h1>
        <p className="settings-subtitle">Manage your personal profile and account preferences</p>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">Personal Information</h2>

        {message && (
          <div className={`message-alert ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column" }}>
          <div className="form-grid">
            {/* First Name Input */}
            <div className="input-group">
              <label className="input-label" htmlFor="firstName">First Name</label>
              <input
                id="firstName"
                type="text"
                className="settings-input"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                required
                disabled={saving}
              />
            </div>

            {/* Last Name Input */}
            <div className="input-group">
              <label className="input-label" htmlFor="lastName">Last Name</label>
              <input
                id="lastName"
                type="text"
                className="settings-input"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Phone Number Input */}
            <div className="input-group full-width">
              <label className="input-label" htmlFor="phone">Phone Number</label>
              <input
                id="phone"
                type="tel"
                className="settings-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={saving}
              />
            </div>
          </div>

          <button type="submit" className="save-btn" disabled={saving || !firstName.trim()}>
            {saving ? "Saving Changes..." : "Save Details"}
          </button>
        </form>
      </div>
    </div>
  );
}