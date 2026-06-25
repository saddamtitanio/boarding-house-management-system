"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { User, Shield, Users, Mail, Phone, Plus, Calendar, Key } from "lucide-react";
import { KosanCard, KosanButton, KosanSearchBar, KosanInput, KosanBadge, LoadingSpinner, useToast } from "@sbhms/ui";

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
  phone: string | null;
  created_at: string;
  role: {
    id: string;
    name: string;
  };
}

export default function UsersPage() {
  const toast = useToast();
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [roleFilter, setRoleFilter] = useState<string>("all");
  const [currentUserRole, setCurrentUserRole] = useState<string | null>(null);

  // Modal State
  const [isAddStaffOpen, setIsAddStaffOpen] = useState(false);
  const [formEmail, setFormEmail] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formFirstName, setFormFirstName] = useState("");
  const [formLastName, setFormLastName] = useState("");
  const [formPhone, setFormPhone] = useState("");
  const [formRole, setFormRole] = useState<"admin" | "employee">("employee");
  const [submitting, setSubmitting] = useState(false);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/users");
      const data = await res.json();
      if (data.success) {
        setUsers(data.data || []);
      }
    } catch (error) {
      console.error("Error loading users:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchMyProfile = async () => {
    try {
      const res = await fetch("/api/profile");
      const data = await res.json();
      if (data.success) {
        setCurrentUserRole(data.data.role?.name || null);
      }
    } catch (error) {
      console.error("Error loading current user profile:", error);
    }
  };

  useEffect(() => {
    fetchUsers();
    fetchMyProfile();
  }, []);

  const handleAddStaffSubmit = async () => {
    if (!formEmail.trim() || !formPassword.trim() || !formFirstName.trim()) {
      toast.warning("Please fill in email, password, and first name.");
      return;
    }

    try {
      setSubmitting(true);
      const res = await fetch("/api/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: formEmail,
          password: formPassword,
          first_name: formFirstName,
          last_name: formLastName,
          phone: formPhone || undefined,
          role: formRole,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.success("Staff account created successfully.");
        setIsAddStaffOpen(false);
        setFormEmail("");
        setFormPassword("");
        setFormFirstName("");
        setFormLastName("");
        setFormPhone("");
        setFormRole("employee");
        fetchUsers();
      } else {
        toast.error("Failed to create staff user: " + (data.error || "Unknown error"));
      }
    } catch (error: any) {
      toast.error("Error creating staff: " + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  const filteredUsers = users.filter((u) => {
    const fullName = `${u.first_name || ""} ${u.last_name || ""}`.toLowerCase();
    const phoneNum = (u.phone || "").toLowerCase();
    const matchesSearch =
      fullName.includes(searchTerm.toLowerCase()) ||
      phoneNum.includes(searchTerm.toLowerCase());

    const matchesRole = roleFilter === "all" || u.role?.name === roleFilter;
    return matchesSearch && matchesRole;
  });

  const getRoleBadgeColor = (roleName: string) => {
    switch (roleName) {
      case "admin":
        return "danger" as const;
      case "employee":
        return "gold" as const;
      default:
        return "success" as const;
    }
  };

  const isAdmin = currentUserRole === "admin";

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-3xl font-bold text-[#2C1A0E]">User Management</h1>
          <p className="text-sm text-[#8B6F5E] mt-1">Manage system accounts, employee assignments, and tenant directories</p>
        </div>
        {isAdmin && (
          <KosanButton
            variant="primary"
            size="sm"
            leftIcon={<Plus size={14} />}
            onClick={() => setIsAddStaffOpen(true)}
          >
            Add Staff Member
          </KosanButton>
        )}
      </div>

      {/* Main Table Card */}
      <KosanCard>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
          <h2 className="text-xl font-bold text-[#2C1A0E]">System Accounts</h2>
          <div className="flex gap-2">
            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-3 py-1.5 text-sm text-[#2C1A0E] focus:outline-none cursor-pointer"
            >
              <option value="all">All Roles</option>
              <option value="admin">Administrators</option>
              <option value="employee">Employees</option>
              <option value="tenant">Tenants</option>
            </select>
          </div>
        </div>

        <div className="mb-4">
          <KosanSearchBar
            placeholder="Search accounts by name or phone..."
            value={searchTerm}
            onChange={setSearchTerm}
          />
        </div>

        {loading ? (
          <LoadingSpinner message="Loading user profiles..." />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-[#C8A96E]/20 text-[#8B6F5E] text-xs font-semibold uppercase">
                  <th className="pb-3">Name</th>
                  <th className="pb-3">Role</th>
                  <th className="pb-3">Contact Phone</th>
                  <th className="pb-3">Joined Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#C8A96E]/10">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="text-[#2C1A0E]">
                    <td className="py-3.5">
                      <div className="flex items-center gap-2.5">
                        <div className="p-1.5 rounded-full bg-[#DFC9A8] text-[#553D2B]">
                          <User size={14} />
                        </div>
                        {u.role?.name === "tenant" ? (
                          <Link href={`/tenants/${u.id}`} className="font-bold hover:underline hover:text-[#C8A96E] transition-colors">
                            {u.first_name} {u.last_name || ""}
                          </Link>
                        ) : (
                          <span className="font-bold">
                            {u.first_name} {u.last_name || ""}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5">
                      <KosanBadge variant={getRoleBadgeColor(u.role?.name)}>
                        <span className="uppercase text-[10px] font-bold tracking-wider">
                          {u.role?.name || "User"}
                        </span>
                      </KosanBadge>
                    </td>
                    <td className="py-3.5 text-[#8B6F5E] font-medium">{u.phone || "—"}</td>
                    <td className="py-3.5 text-xs text-[#8B6F5E]">{formatDate(u.created_at)}</td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-6 text-center text-[#8B6F5E]">
                      No accounts matched the filters.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </KosanCard>

      {/* Add Staff Modal */}
      {isAddStaffOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-[#EFE3D0] rounded-2xl p-6 w-full max-w-md border border-[#C8A96E]/30 flex flex-col max-h-[600px] overflow-y-auto">
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">Create Staff Account</h2>

            <div className="space-y-4">
              <KosanInput
                label="Email Address"
                type="email"
                placeholder="e.g., employee@kosanmama.com"
                value={formEmail}
                onChange={(e) => setFormEmail(e.target.value)}
                required
              />

              <KosanInput
                label="Login Password"
                type="password"
                placeholder="Secure password"
                value={formPassword}
                onChange={(e) => setFormPassword(e.target.value)}
                required
              />

              <KosanInput
                label="First Name"
                placeholder="First Name"
                value={formFirstName}
                onChange={(e) => setFormFirstName(e.target.value)}
                required
              />

              <KosanInput
                label="Last Name"
                placeholder="Last Name"
                value={formLastName}
                onChange={(e) => setFormLastName(e.target.value)}
              />

              <KosanInput
                label="Phone Number"
                placeholder="e.g., 0812345678"
                value={formPhone}
                onChange={(e) => setFormPhone(e.target.value)}
              />

              <div>
                <label className="text-sm font-semibold text-[#2C1A0E] mb-1.5 block">
                  Staff Role
                </label>
                <select
                  value={formRole}
                  onChange={(e) => setFormRole(e.target.value as "admin" | "employee")}
                  className="w-full bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-4 py-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B]"
                >
                  <option value="employee">Employee / Worker</option>
                  <option value="admin">Administrator</option>
                </select>
              </div>
            </div>

            <div className="flex gap-3 mt-6">
              <KosanButton variant="secondary" fullWidth onClick={() => setIsAddStaffOpen(false)}>
                Cancel
              </KosanButton>
              <KosanButton
                variant="primary"
                fullWidth
                onClick={handleAddStaffSubmit}
                disabled={submitting}
              >
                {submitting ? "Creating Account..." : "Create Account"}
              </KosanButton>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}