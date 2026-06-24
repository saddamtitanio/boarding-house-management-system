"use client";

import { useState, useEffect } from "react";
import "./settings.css";
import { useTranslation } from "@/src/contexts/LanguageContext";
import { createClient } from "@/src/app/lib/supabase/client";

export default function SettingsPage() {
  const { language, setLanguage, t } = useTranslation();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
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
          setAvatarUrl(data.data.avatar_url || null);
        }
      } catch (err) {
        console.error("Failed to load user profile", err);
      } finally {
        setLoading(false);
      }
    }
    loadProfile();
  }, []);

  // Handle avatar file upload to Supabase Storage
  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setMessage(null);

    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setMessage({ type: "error", text: "You must be signed in to upload an avatar." });
        return;
      }

      const fileExt = file.name.split(".").pop();
      const filePath = `${user.id}_${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file);

      if (uploadError) {
        throw uploadError;
      }

      const { data: { publicUrl } } = supabase.storage
        .from("avatars")
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
    } catch (err: any) {
      console.error("Avatar upload failed:", err);
      setMessage({ type: "error", text: "Failed to upload avatar: " + (err.message || err) });
    } finally {
      setUploading(false);
    }
  };

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
          avatar_url: avatarUrl,
        }),
      });
      const data = await res.json();

      if (data.success) {
        setMessage({ type: "success", text: t("settings.success") });
      } else {
        setMessage({ type: "error", text: data.error || t("settings.error") });
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
        <p style={{ color: "#8B6F5E" }}>{t("settings.loading")}</p>
      </div>
    );
  }

  return (
    <div className="settings-layout">
      {/* Page Header */}
      <div className="settings-header">
        <h1 className="settings-title">{t("settings.title")}</h1>
        <p className="settings-subtitle">{t("settings.subtitle")}</p>
      </div>

      <div className="settings-card">
        <h2 className="settings-section-title">{t("settings.personal_info")}</h2>

        <div className="avatar-picker-container">
          <label htmlFor="avatar-file-input" className="avatar-preview-wrapper">
            {avatarUrl ? (
              <img src={avatarUrl} alt="Avatar" className="avatar-img" />
            ) : (
              <div className="avatar-initial">
                {(firstName ? firstName.charAt(0) : "U").toUpperCase()}
              </div>
            )}
            {uploading && <div className="uploading-overlay">Uploading...</div>}
          </label>
          <label htmlFor="avatar-file-input" className="avatar-upload-label">
            Change Profile Picture
          </label>
          <input
            id="avatar-file-input"
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            disabled={uploading || saving}
            style={{ display: "none" }}
          />
        </div>

        {message && (
          <div className={`message-alert ${message.type}`}>
            {message.text}
          </div>
        )}

        <form onSubmit={handleSave} style={{ display: "flex", flexDirection: "column" }}>
          <div className="form-grid">
            {/* First Name Input */}
            <div className="input-group">
              <label className="input-label" htmlFor="firstName">{t("settings.first_name")}</label>
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
              <label className="input-label" htmlFor="lastName">{t("settings.last_name")}</label>
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
              <label className="input-label" htmlFor="phone">{t("settings.phone")}</label>
              <input
                id="phone"
                type="tel"
                className="settings-input"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                disabled={saving}
              />
            </div>

            {/* Preferred Language Input */}
            <div className="input-group full-width">
              <label className="input-label" htmlFor="language">{t("settings.language")}</label>
              <select
                id="language"
                className="settings-input cursor-pointer"
                value={language}
                onChange={(e) => setLanguage(e.target.value as "en" | "id")}
                disabled={saving}
              >
                <option value="en">English (US)</option>
                <option value="id">Bahasa Indonesia</option>
              </select>
            </div>
          </div>

          <button type="submit" className="save-btn" disabled={saving || !firstName.trim()}>
            {saving ? t("settings.saving") : t("settings.save")}
          </button>
        </form>
      </div>
    </div>
  );
}
