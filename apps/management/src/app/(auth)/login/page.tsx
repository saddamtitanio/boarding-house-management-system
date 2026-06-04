"use client";

import { useState } from "react";
import { Mail, Lock, User } from "lucide-react";
import { KosanButton, KosanInput, KosanDivider, KosanCard } from "@sbhms/ui";
import { createClient } from "@/src/app/lib/supabase/client";

const COUNTRY_CODES = [
  { code: "+62", country: "Indonesia" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+65", country: "Singapore" },
  { code: "+60", country: "Malaysia" },
  { code: "+61", country: "Australia" },
];

export default function LoginPage() {
  const supabase = createClient();

  const [activeTab, setActiveTab] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [countryCode, setCountryCode] = useState("+62");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    let loginData;
    if (activeTab === "email") {
      loginData = { email: email.trim(), password };
    } else {
      let phoneNum = phone.trim().replace(/^0+/, ""); // strip leading zeros
      phoneNum = countryCode + phoneNum;
      
      try {
        const res = await fetch("/api/auth/resolve-phone", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ phone: phoneNum }),
        });
        const data = await res.json();
        if (!data.success) {
          setError(data.error || "Phone number is not registered");
          setIsLoading(false);
          return;
        }
        loginData = { email: data.email, password };
      } catch (err: any) {
        setError(err.message || "Failed to resolve phone number");
        setIsLoading(false);
        return;
      }
    }

    const { error: signInError } = await supabase.auth.signInWithPassword(loginData);

    setIsLoading(false);
    if (signInError) {
      const cleanMessage =
        signInError.message.charAt(0).toUpperCase() + signInError.message.substring(1);
      setError(cleanMessage);
      return;
    }

    window.location.href = "/dashboard";
  };

  const handleOAuthSignIn = async (provider: "google" | "facebook" | "apple") => {
    setError(null);
    setIsLoading(true);
    const { error: authError } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });
    if (authError) {
      setError(authError.message);
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-[#F5E6D3] via-[#EFE3D0] to-[#DFC9A8] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold text-[#2C1A0E] tracking-tight">Kosan Mama</h1>
          <p className="text-sm text-[#8B6F5E] mt-2 font-medium">
            Sign in to your management account
          </p>
        </div>

        {/* Login Form Card */}
          <KosanCard className="bg-transparent border-none p-6 md:p-8" padding="none">
          {/* Tab Selector */}
          <div className="flex border-b border-[#C8A96E]/20 mb-6">
            <button
              type="button"
              onClick={() => {
                setActiveTab("email");
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all duration-200 ${
                activeTab === "email"
                  ? "border-[#553D2B] text-[#553D2B]"
                  : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
              }`}
            >
              Email Login
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab("phone");
                setError(null);
              }}
              className={`flex-1 pb-3 text-sm font-semibold text-center border-b-2 transition-all duration-200 ${
                activeTab === "phone"
                  ? "border-[#553D2B] text-[#553D2B]"
                  : "border-transparent text-[#8B6F5E] hover:text-[#553D2B]"
              }`}
            >
              Phone Login
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            {error && <p className="text-red-500 text-sm font-semibold">{error}</p>}

            {/* Email Field */}
            {activeTab === "email" && (
              <KosanInput
                label="Email Address"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                leftIcon={<Mail size={16} />}
                required
              />
            )}

            {/* Phone Field */}
            {activeTab === "phone" && (
              <div className="space-y-1.5 w-full">
                <label className="block text-sm font-semibold text-[#2C1A0E]">
                  Phone Number <span className="text-[#C0444A]">*</span>
                </label>
                <div className="flex gap-2">
                  {/* Country Code Selector */}
                  <div className="relative flex-shrink-0">
                    <select
                      value={countryCode}
                      onChange={(e) => setCountryCode(e.target.value)}
                      className="
                        appearance-none bg-[#EFE3D0] border border-[#C8A96E]/50
                        rounded-xl px-3 py-3 pr-8 text-sm font-semibold text-[#2C1A0E]
                        focus:outline-none focus:border-[#553D2B] focus:ring-2 focus:ring-[#553D2B]/20
                        cursor-pointer h-full transition-all duration-200
                      "
                    >
                      {COUNTRY_CODES.map((country) => (
                        <option key={country.code} value={country.code}>
                          {country.code}
                        </option>
                      ))}
                    </select>
                    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-[#8B6F5E] text-xs">
                      ▼
                    </span>
                  </div>

                  {/* Phone Input */}
                  <KosanInput
                    type="tel"
                    placeholder="812345678"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    leftIcon={<User size={16} />}
                    className="flex-1"
                    required
                  />
                </div>
              </div>
            )}

            {/* Password Field */}
            <KosanInput
              label="Password"
              type="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              leftIcon={<Lock size={16} />}
              required
            />

            {/* Login Button */}
            <KosanButton
              type="submit"
              variant="primary"
              size="lg"
              fullWidth
              loading={isLoading}
              className="mt-2"
            >
              Login
            </KosanButton>
          </form>
        </KosanCard>
      </div>
    </div>
  );
}