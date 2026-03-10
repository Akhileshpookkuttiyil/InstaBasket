import React, { useEffect, useState } from "react";
import { Star, X, Trash2 } from "lucide-react";
import toast from "react-hot-toast";
import apiClient from "../shared/lib/apiClient";

const RatingModal = ({ productId, productName, productImage, onClose, onSaved }) => {
  const [rating, setRating] = useState(0);
  const [hovered, setHovered] = useState(0);
  const [review, setReview] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [eligibility, setEligibility] = useState({
    canRate: false,
    canEdit: false,
    reason: "",
  });

  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "";
    };
  }, []);

  useEffect(() => {
    const fetchRatingState = async () => {
      try {
        const [eligibilityRes, myRatingRes] = await Promise.all([
          apiClient.get(`/api/ratings/product/${productId}/eligibility`),
          apiClient.get(`/api/ratings/product/${productId}/my`),
        ]);

        if (eligibilityRes.data.success) {
          setEligibility(eligibilityRes.data.eligibility);
        }

        const existing = myRatingRes.data?.rating;
        if (myRatingRes.data.success && existing) {
          setRating(existing.rating || 0);
          setReview(existing.review || "");
          setIsEditing(true);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to load rating info");
      } finally {
        setLoading(false);
      }
    };

    fetchRatingState();
  }, [productId]);

  const submitRating = async () => {
    if (rating < 1 || rating > 5) {
      toast.error("Please select a rating");
      return;
    }

    setSaving(true);
    try {
      const { data } = await apiClient.post("/api/ratings", {
        productId,
        rating,
        review: review.trim(),
      });

      if (data.success) {
        toast.success(isEditing ? "Review updated" : "Review submitted");
        onSaved?.();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save review");
    } finally {
      setSaving(false);
    }
  };

  const deleteRating = async () => {
    if (!window.confirm("Delete your review?")) return;

    setSaving(true);
    try {
      const { data } = await apiClient.delete(`/api/ratings/product/${productId}`);
      if (data.success) {
        toast.success("Review deleted");
        onSaved?.();
        onClose();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete review");
    } finally {
      setSaving(false);
    }
  };

  const canSubmit = eligibility.canRate || isEditing;

  return (
    <div className="fixed inset-0 z-50 bg-black/45 flex items-center justify-center px-4">
      <div className="w-full max-w-lg rounded-xl bg-white shadow-xl overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-200 flex items-center justify-between">
          <h3 className="font-semibold text-gray-800">
            {isEditing ? "Edit Your Review" : "Rate This Product"}
          </h3>
          <button
            onClick={onClose}
            className="rounded p-1.5 hover:bg-gray-100 transition"
            aria-label="Close rating dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-5">
          <div className="flex gap-3 mb-5">
            <img
              src={productImage || "/placeholder.jpg"}
              alt={productName}
              className="w-14 h-14 object-cover rounded border border-gray-200"
            />
            <div>
              <p className="font-medium text-gray-800">{productName}</p>
              <p className="text-xs text-gray-500 mt-1">
                Verified buyers can add and edit reviews.
              </p>
            </div>
          </div>

          {loading ? (
            <p className="text-sm text-gray-500">Loading review options...</p>
          ) : (
            <>
              {!canSubmit && (
                <p className="mb-4 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-700">
                  {eligibility.reason || "You are not eligible to rate this product yet."}
                </p>
              )}

              <div className="flex items-center gap-2 mb-4">
                {[1, 2, 3, 4, 5].map((value) => {
                  const active = value <= (hovered || rating);
                  return (
                    <button
                      key={value}
                      type="button"
                      onMouseEnter={() => setHovered(value)}
                      onMouseLeave={() => setHovered(0)}
                      onClick={() => setRating(value)}
                      className="p-1"
                    >
                      <Star
                        size={24}
                        className={active ? "fill-yellow-400 text-yellow-400" : "text-gray-300"}
                      />
                    </button>
                  );
                })}
                <span className="text-sm text-gray-600">{rating ? `${rating}/5` : ""}</span>
              </div>

              <label htmlFor="review" className="text-sm font-medium text-gray-700">
                Review
              </label>
              <textarea
                id="review"
                rows={4}
                maxLength={800}
                value={review}
                onChange={(event) => setReview(event.target.value)}
                placeholder="Share your product experience"
                className="mt-1 w-full rounded border border-gray-300 px-3 py-2.5 outline-none focus:border-primary resize-none"
              />
              <p className="text-xs text-gray-400 mt-1">{review.length}/800</p>

              <div className="mt-5 flex items-center gap-3">
                <button
                  onClick={submitRating}
                  disabled={saving || !canSubmit}
                  className={`flex-1 rounded py-2.5 font-medium transition ${
                    saving || !canSubmit
                      ? "bg-primary/70 text-white cursor-not-allowed"
                      : "bg-primary text-white hover:bg-primary-dull"
                  }`}
                >
                  {saving ? "Saving..." : isEditing ? "Update Review" : "Submit Review"}
                </button>

                {isEditing && (
                  <button
                    onClick={deleteRating}
                    disabled={saving}
                    className="rounded border border-red-200 px-3 py-2.5 text-red-500 hover:bg-red-50 transition"
                    title="Delete review"
                  >
                    <Trash2 size={18} />
                  </button>
                )}
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default RatingModal;
