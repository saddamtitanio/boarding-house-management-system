"use client";

import { useState } from "react";
import Link from "next/link";
import { Mail, Lock } from "lucide-react";
import { KosanButton, KosanInput, KosanDivider } from "@sbhms/ui";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    // TODO: Add actual login logic here
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        
        {/* Logo and Header */}
        <div className="text-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-[#553D2B] flex items-center justify-center mx-auto mb-4 shadow-lg">
            <span className="text-[#C8A96E] font-black text-xl">KM</span>
          </div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">Welcome back</h1>
          <p className="text-sm text-[#8B6F5E] mt-1">
            Sign in to your Kosan Mama account
          </p>
        </div>

        {/* Login Form Card */}
        <div className="bg-[#EFE3D0] rounded-2xl border border-[#C8A96E]/30 p-8 shadow-xl">
          <form onSubmit={handleSubmit} className="space-y-5">
            
            {/* Email Field */}
            <KosanInput
              label="Email Address or Phone Number"
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              leftIcon={<Mail size={16} />}
              required
            />

            {/* Password Field */}
            <div>
              <KosanInput
                label="Password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock size={16} />}
                rightElement={
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="text-xs font-semibold text-[#C8A96E] hover:text-[#553D2B] transition-colors"
                  >
                    {showPassword ? "Hide" : "Show"}
                  </button>
                }
                required
              />
              
              {/* Forgot Password Link */}
              <div className="text-right mt-2">
                <Link
                  href="/forgot-password"
                  className="text-xs font-semibold text-[#C8A96E] hover:text-[#553D2B] transition-colors"
                >
                  Forgot Password?
                </Link>
              </div>
            </div>

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

          {/* Sign Up Link */}
          <p className="text-center text-sm text-[#8B6F5E] mt-6">
            Don't have an account?{" "}
            <Link
              href="/register"
              className="font-semibold text-[#553D2B] hover:text-[#C8A96E] transition-colors"
            >
              Sign Up
            </Link>
          </p>

          {/* Divider */}
          <KosanDivider label="or continue with" className="my-6" />

          {/* Social Login Buttons */}
          <div className="space-y-2.5">
            <KosanButton variant="secondary" size="md" fullWidth>
              Continue with Google
            </KosanButton>
            <KosanButton variant="secondary" size="md" fullWidth>
              Continue with Apple
            </KosanButton>
            <KosanButton variant="secondary" size="md" fullWidth>
              Continue with Facebook
            </KosanButton>
          </div>
        </div>
      </div>
    </div>
  );
}