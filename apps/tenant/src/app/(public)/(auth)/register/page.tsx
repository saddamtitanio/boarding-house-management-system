"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, User, Phone, Lock } from "lucide-react";
import { KosanButton, KosanInput, useToast } from "@sbhms/ui";
import { createClient } from "@/src/app/lib/supabase/client";

const COUNTRY_CODES = [
  { code: "+62", country: "Indonesia" },
  { code: "+1", country: "USA/Canada" },
  { code: "+44", country: "UK" },
  { code: "+65", country: "Singapore" },
  { code: "+60", country: "Malaysia" },
  { code: "+61", country: "Australia" },
];

export default function RegisterPage() {
  const router = useRouter();
  const supabase = createClient();
  const toast = useToast();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    phone: "",
    password: "",
  });
  
  const [countryCode, setCountryCode] = useState("+62");
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    
    const email = formData.email.trim();
    const password = formData.password;
    const phone = countryCode + formData.phone.trim();
    const first_name = formData.firstName.trim();
    const last_name = formData.lastName.trim();

    if (!email || !password || !formData.phone.trim() || !first_name) {
      toast.error("Please fill in all required fields.");
      setIsLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            phone,
          }
        }
      });

      if (error) {
        toast.error(error.message);
      } else {
        toast.success("Registration successful! You may now sign in.");
        router.push("/login");
      }
    } catch (err: any) {
      toast.error("Registration failed: " + err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F5E6D3] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md">
        
        {/* Logo and Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#2C1A0E]">Create Account</h1>
          <p className="text-sm text-[#8B6F5E] mt-1">
            Join Kosan Mama
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="">
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Field */}
            <KosanInput
              label="Email Address"
              type="email"
              placeholder="example@email.com"
              value={formData.email}
              onChange={handleChange("email")}
              leftIcon={<Mail size={16} />}
              required
            />

            {/* First and Last Name Row */}
            <div className="grid grid-cols-2 gap-3">
              <KosanInput
                label="First Name"
                placeholder="Enter your first name"
                value={formData.firstName}
                onChange={handleChange("firstName")}
                leftIcon={<User size={16} />}
                required
              />
              <KosanInput
                label="Last Name"
                placeholder="Enter your last name"
                value={formData.lastName}
                onChange={handleChange("lastName")}
              />
            </div>

            {/* Phone Number with Country Code */}
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-[#2C1A0E]">
                Phone Number <span className="text-[#C0444A]">*</span>
              </label>
              <div className="flex gap-2">
                {/* Country Code Selector */}
                <div className="relative">
                  <select
                    value={countryCode}
                    onChange={(e) => setCountryCode(e.target.value)}
                    className="
                      appearance-none bg-[#EFE3D0] border border-[#C8A96E]/50
                      rounded-xl px-3 py-3 pr-7 text-sm font-semibold text-[#2C1A0E]
                      focus:outline-none focus:border-[#553D2B] focus:ring-2 focus:ring-[#553D2B]/20
                      cursor-pointer
                    "
                  >
                    {COUNTRY_CODES.map((country) => (
                      <option key={country.code} value={country.code}>
                        {country.code}
                      </option>
                    ))}
                  </select>
                  <span className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[#8B6F5E] text-xs">
                    ▼
                  </span>
                </div>
                
                {/* Phone Number Input */}
                <KosanInput
                  type="tel"
                  placeholder="81234567884"
                  value={formData.phone}
                  onChange={handleChange("phone")}
                  leftIcon={<Phone size={16} />}
                  className="flex-1"
                  required
                />
              </div>
            </div>

            {/* Password Field */}
            <KosanInput
              label="Password"
              type={showPassword ? "text" : "password"}
              placeholder="Must have at least 6 characters"
              value={formData.password}
              onChange={handleChange("password")}
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

            {/* Create Account Button */}
            <KosanButton
              type="submit"
              variant="gold"
              size="lg"
              fullWidth
              loading={isLoading}
              className="mt-2"
            >
              Create Account
            </KosanButton>
          </form>

          {/* Sign In Link */}
          <p className="text-center text-sm text-[#8B6F5E] mt-6">
            Already have an account?{" "}
            <Link
              href="/login"
              className="font-semibold text-[#553D2B] hover:text-[#C8A96E] transition-colors"
            >
              Sign In
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}