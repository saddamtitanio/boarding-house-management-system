"use client";

import { useState, useEffect } from "react";
import { Star, ThumbsUp, Check, User, Calendar, ShieldAlert } from "lucide-react";
import { KosanCard, KosanButton } from "@sbhms/ui";
import { LoadingSpinner } from "@sbhms/ui";
import { useLeaseContext } from "@/src/contexts/LeaseContext";
import Link from "next/link";

interface FeedbackItem {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  tenant: {
    id: string;
    first_name: string;
    last_name: string;
  } | null;
}

export default function FeedbackPage() {
  const { hasActiveLease, isLoading: leaseLoading } = useLeaseContext();
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>("");
  const [feedbackList, setFeedbackList] = useState<FeedbackItem[]>([]);
  const [submitted, setSubmitted] = useState<boolean>(false);
  const [loadingForm, setLoadingForm] = useState<boolean>(false);
  const [loadingList, setLoadingList] = useState<boolean>(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Fetch all feedback items on load
  useEffect(() => {
    fetchFeedbacks();
  }, []);

  const fetchFeedbacks = async () => {
    try {
      const res = await fetch("/api/feedback");
      const data = await res.json();
      if (data.success && Array.isArray(data.data)) {
        setFeedbackList(data.data);
      }
    } catch (err) {
      console.error("Failed to load feedbacks", err);
    } finally {
      setLoadingList(false);
    }
  };

  // Submit feedback rating and comments to database
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (rating === 0) {
      setErrorMessage("Please select a rating of at least 1 star.");
      return;
    }

    setLoadingForm(true);
    setErrorMessage(null);

    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ rating, comment }),
      });
      const data = await res.json();

      if (data.success) {
        setSubmitted(true);
        setRating(0);
        setComment("");
        fetchFeedbacks();
      } else {
        setErrorMessage(data.error || "An error occurred while submitting feedback.");
      }
    } catch (err) {
      console.error("Failed to submit feedback", err);
      setErrorMessage("Failed to connect to the server.");
    } finally {
      setLoadingForm(false);
    }
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (leaseLoading) {
    return <LoadingSpinner message="Loading…" />;
  }

  if (!hasActiveLease && !leaseLoading) {
    return (
      <div className="min-h-screen bg-[#1A0E0A] p-6 flex items-center justify-center">
        <KosanCard className="w-full max-w-md text-center p-8 flex flex-col items-center">
          <div className="w-16 h-16 rounded-full bg-[#C8A96E]/10 flex items-center justify-center mb-4">
            <ShieldAlert size={32} className="text-[#C8A96E]" />
          </div>
          <h2 className="text-2xl font-bold text-[#DFC9A8] mb-2">Active Lease Required</h2>
          <p className="text-sm text-[#DFC9A8]/75 mb-6">
            You need an active lease to submit feedback and reviews. Please book a room first.
          </p>
          <Link href="/dashboard">
            <KosanButton variant="primary">Go to Dashboard</KosanButton>
          </Link>
        </KosanCard>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-[#1A0E0A] p-6 text-[#F5E6D3]">
      {/* Page Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#F5E6D3]">Feedback & Reviews</h1>
        <p className="text-sm text-[#DFC9A8] mt-1">Help us improve the Kosan Mama experience by sharing your feedback</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* Left column: Submit Feedback */}
        <div className="lg:col-span-1">
          <KosanCard>
            {submitted ? (
              <div className="flex flex-col items-center text-center p-6 space-y-4">
                <div className="w-12 h-12 rounded-full bg-[#C8A96E]/10 flex items-center justify-center text-[#C8A96E]">
                  <Check size={24} />
                </div>
                <h3 className="text-lg font-bold text-[#2C1A0E]">Feedback Submitted</h3>
                <p className="text-sm text-[#8B6F5E]">
                  Thank you for sharing your thoughts. Your feedback has been recorded successfully.
                </p>
                <KosanButton variant="primary" fullWidth onClick={() => setSubmitted(false)}>
                  Submit Another Feedback
                </KosanButton>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                <h2 className="text-lg font-bold text-[#2C1A0E]">Share your Feedback</h2>

                {/* Star selection input */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#8B6F5E]">Your Rating</span>
                  <div className="flex items-center gap-2">
                    {[1, 2, 3, 4, 5].map((num) => (
                      <button
                        key={num}
                        type="button"
                        className="p-1 transition-transform hover:scale-110 active:scale-95 focus:outline-none cursor-pointer"
                        onClick={() => setRating(num)}
                        onMouseEnter={() => setHoverRating(num)}
                        onMouseLeave={() => setHoverRating(0)}
                        title={`${num} Star${num > 1 ? "s" : ""}`}
                      >
                        <Star
                          size={32}
                          className={
                            (hoverRating || rating) >= num
                              ? "fill-[#C8A96E] text-[#C8A96E]"
                              : "text-[#C8A96E]/30"
                          }
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Comment details textarea */}
                <div className="space-y-2">
                  <span className="block text-xs font-bold uppercase tracking-wider text-[#8B6F5E]">Detailed Comments</span>
                  <textarea
                    className="w-full bg-[#EFE3D0] border border-[#C8A96E]/30 rounded-xl p-3 text-sm text-[#2C1A0E] focus:outline-none focus:border-[#553D2B] min-h-[120px] placeholder-[#8B6F5E]/60 transition-all resize-none"
                    placeholder="Describe your experience at Kosan Mama, including the facilities, staff interaction, or suggestion details..."
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    required
                  />
                </div>

                {errorMessage && (
                  <p className="text-xs text-[#C0444A] font-semibold">{errorMessage}</p>
                )}

                <KosanButton
                  type="submit"
                  variant="primary"
                  fullWidth
                  disabled={loadingForm || rating === 0}
                  loading={loadingForm}
                >
                  Submit Review
                </KosanButton>
              </form>
            )}
          </KosanCard>
        </div>

        {/* Right column: Recent reviews list */}
        <div className="lg:col-span-2 space-y-4">
          <KosanCard>
            <h2 className="text-lg font-bold text-[#2C1A0E] mb-4">Recent Feedback from Tenants</h2>
            <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
              {loadingList ? (
                <p className="text-center py-12 text-sm text-[#8B6F5E]">Loading feedback history...</p>
              ) : feedbackList.length === 0 ? (
                <div className="text-center py-12 text-[#8B6F5E] flex flex-col items-center justify-center">
                  <ThumbsUp size={28} className="text-[#C8A96E]/40 mb-3" />
                  <p className="text-sm">No feedback entries found yet.</p>
                </div>
              ) : (
                feedbackList.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 space-y-2.5"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <User size={14} className="text-[#8B6F5E]" />
                          <h4 className="font-bold text-sm text-[#2C1A0E]">
                            {item.tenant
                              ? `${item.tenant.first_name} ${item.tenant.last_name || ""}`
                              : "Anonymous Tenant"}
                          </h4>
                        </div>
                        <p className="text-[10px] text-[#8B6F5E] mt-0.5 flex items-center gap-1">
                          <Calendar size={10} /> {formatDate(item.created_at)}
                        </p>
                      </div>

                      <div className="flex items-center gap-0.5">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            size={13}
                            className={
                              star <= item.rating
                                ? "fill-[#C8A96E] text-[#C8A96E]"
                                : "text-[#C8A96E]/25"
                            }
                          />
                        ))}
                      </div>
                    </div>

                    <p className="text-sm text-[#DFC9A8] leading-relaxed italic bg-[#1A0E0A] p-3 rounded-xl border border-[#C8A96E]/15">
                      "{item.comment || "No written review comments provided."}"
                    </p>
                  </div>
                ))
              )}
            </div>
          </KosanCard>
        </div>
      </div>
    </div>
  );
}
