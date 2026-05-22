"use client";

import { useEffect, useState } from "react";
import { Star, MessageSquare, Calendar, Filter, User, Percent } from "lucide-react";
import { KosanCard, KosanSearchBar, KosanBadge } from "@sbhms/ui";

interface Feedback {
  id: string;
  rating: number;
  comment: string;
  created_at: string;
  tenant?: {
    first_name: string;
    last_name: string;
    phone?: string;
  };
}

export default function FeedbackPage() {
  const [feedbackList, setFeedbackList] = useState<Feedback[]>([]);
  const [loading, setLoading] = useState(true);
  const [ratingFilter, setRatingFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");

  const fetchFeedback = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/feedback");
      const data = await res.json();
      if (data.success) {
        setFeedbackList(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching feedback list:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFeedback();
  }, []);

  const totalReviews = feedbackList.length;
  const averageRating =
    totalReviews > 0
      ? (feedbackList.reduce((acc, curr) => acc + curr.rating, 0) / totalReviews).toFixed(1)
      : "0.0";

  // Compute count per star
  const starCounts = [0, 0, 0, 0, 0]; // index 0 = 1 star, 4 = 5 stars
  feedbackList.forEach((fb) => {
    const starIndex = fb.rating - 1;
    if (starIndex >= 0 && starIndex < 5) {
      starCounts[starIndex]++;
    }
  });

  const getStarPercentage = (count: number) => {
    if (totalReviews === 0) return 0;
    return Math.round((count / totalReviews) * 100);
  };

  const filteredFeedback = feedbackList.filter((fb) => {
    const tenantName = `${fb.tenant?.first_name || ""} ${fb.tenant?.last_name || ""}`.toLowerCase();
    const commentText = (fb.comment || "").toLowerCase();
    const matchesSearch =
      tenantName.includes(searchTerm.toLowerCase()) ||
      commentText.includes(searchTerm.toLowerCase());

    const matchesRating = ratingFilter === "all" || fb.rating === parseInt(ratingFilter);
    return matchesSearch && matchesRating;
  });

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F5E6D3] p-6 flex items-center justify-center">
        <p className="text-lg font-semibold text-[#8B6F5E]">Loading feedback reviews...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F5E6D3] p-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-[#2C1A0E]">Tenant Feedback</h1>
        <p className="text-sm text-[#8B6F5E] mt-1">Review ratings and suggestions from Kosan Mama residents</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Rating Analytics Side Panel */}
        <div className="space-y-6">
          <KosanCard>
            <h2 className="text-xl font-bold text-[#2C1A0E] mb-4">Rating Analytics</h2>
            
            <div className="text-center py-6 border-b border-[#C8A96E]/20">
              <p className="text-5xl font-black text-[#553D2B]">{averageRating}</p>
              <div className="flex items-center justify-center gap-1 my-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <Star
                    key={star}
                    size={20}
                    className={
                      star <= Math.round(parseFloat(averageRating))
                        ? "fill-[#C8A96E] text-[#C8A96E]"
                        : "text-[#C8A96E]/30"
                    }
                  />
                ))}
              </div>
              <p className="text-xs text-[#8B6F5E] font-semibold uppercase tracking-wider">
                Based on {totalReviews} Tenant Reviews
              </p>
            </div>

            {/* Progress Bars for Ratings */}
            <div className="space-y-3 pt-6">
              {[5, 4, 3, 2, 1].map((stars) => {
                const count = starCounts[stars - 1];
                const pct = getStarPercentage(count);
                return (
                  <div key={stars} className="flex items-center gap-3 text-sm">
                    <span className="w-12 text-xs font-bold text-[#2C1A0E] flex items-center gap-1">
                      {stars} <Star size={11} className="fill-[#553D2B] text-[#553D2B]" />
                    </span>
                    <div className="flex-1 h-2 rounded bg-[#DFC9A8]/40 overflow-hidden">
                      <div
                        className="h-full bg-[#553D2B]"
                        style={{ width: `${pct}%` }}
                      />
                    </div>
                    <span className="w-10 text-right text-xs font-semibold text-[#8B6F5E]">{pct}%</span>
                  </div>
                );
              })}
            </div>
          </KosanCard>
        </div>

        {/* Feedback List Section */}
        <div className="lg:col-span-2 space-y-6">
          <KosanCard>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <h2 className="text-xl font-bold text-[#2C1A0E]">All Tenant Reviews</h2>
              <div className="flex gap-2">
                <select
                  value={ratingFilter}
                  onChange={(e) => setRatingFilter(e.target.value)}
                  className="bg-[#EFE3D0] border border-[#C8A96E]/50 rounded-xl px-3 py-1.5 text-sm text-[#2C1A0E] focus:outline-none cursor-pointer"
                >
                  <option value="all">All Ratings</option>
                  <option value="5">5 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="2">2 Stars</option>
                  <option value="1">1 Star</option>
                </select>
              </div>
            </div>

            <div className="mb-4">
              <KosanSearchBar
                placeholder="Search reviews by tenant or keywords..."
                value={searchTerm}
                onChange={setSearchTerm}
              />
            </div>

            <div className="space-y-4">
              {filteredFeedback.map((fb) => (
                <div
                  key={fb.id}
                  className="p-4 rounded-xl bg-[#EFE3D0] border border-[#C8A96E]/20 space-y-2.5"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-1.5">
                        <User size={14} className="text-[#8B6F5E]" />
                        <h4 className="font-bold text-sm text-[#2C1A0E]">
                          {fb.tenant?.first_name} {fb.tenant?.last_name || ""}
                        </h4>
                      </div>
                      <p className="text-[10px] text-[#8B6F5E] mt-0.5 flex items-center gap-1">
                        <Calendar size={10} /> {formatDate(fb.created_at)}
                      </p>
                    </div>

                    <div className="flex items-center gap-0.5">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star
                          key={star}
                          size={13}
                          className={
                            star <= fb.rating
                              ? "fill-[#C8A96E] text-[#C8A96E]"
                              : "text-[#C8A96E]/20"
                          }
                        />
                      ))}
                    </div>
                  </div>

                  <p className="text-sm text-[#553D2B] leading-relaxed italic bg-[#F5E6D3]/40 p-3 rounded-lg border border-[#C8A96E]/10">
                    "{fb.comment || "No written review comments provided."}"
                  </p>
                </div>
              ))}

              {filteredFeedback.length === 0 && (
                <div className="text-center py-12 text-[#8B6F5E]">
                  <MessageSquare size={40} className="mx-auto text-[#C8A96E]/40 mb-3" />
                  <p className="text-sm">No reviews found matching the search criteria.</p>
                </div>
              )}
            </div>
          </KosanCard>
        </div>
      </div>
    </div>
  );
}