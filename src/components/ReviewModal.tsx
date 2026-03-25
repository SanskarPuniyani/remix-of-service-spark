import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Star, Loader2, MessageSquare } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface ReviewModalProps {
  bookingId: string;
  providerId: string;
  providerName: string;
  workerId?: string;
  workerName?: string;
  serviceName: string;
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewModal = ({
  bookingId,
  providerId,
  providerName,
  workerId,
  workerName,
  serviceName,
  open,
  onClose,
  onSuccess,
}: ReviewModalProps) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [workerRating, setWorkerRating] = useState(5);
  const [workerComment, setWorkerComment] = useState("");
  const [loading, setLoading] = useState(false);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [hoveredWorkerRating, setHoveredWorkerRating] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    try {
      // 1. Insert the review
      const { error: reviewError } = await supabase.from("reviews").insert({
        booking_id: bookingId,
        user_id: user.id,
        provider_id: providerId,
        rating,
        comment,
        worker_id: workerId || null,
        worker_rating: workerId ? workerRating : null,
        worker_comment: workerId ? workerComment : null,
      });

      if (reviewError) throw reviewError;

      // 2. Recalculate provider rating
      const { data: pReviews } = await supabase
        .from("reviews")
        .select("rating")
        .eq("provider_id", providerId);

      if (pReviews && pReviews.length > 0) {
        const avgRating = pReviews.reduce((acc, curr) => acc + curr.rating, 0) / pReviews.length;
        await supabase
          .from("providers")
          .update({ 
            rating: Number(avgRating.toFixed(1)),
            completed_jobs: pReviews.length 
          })
          .eq("id", providerId);
      }

      // 3. Recalculate worker rating if applicable
      if (workerId) {
        const { data: wReviews } = await supabase
          .from("reviews")
          .select("worker_rating")
          .eq("worker_id", workerId)
          .not("worker_rating", "is", null);

        if (wReviews && wReviews.length > 0) {
          const avgRating = wReviews.reduce((acc, curr) => acc + (curr.worker_rating || 0), 0) / wReviews.length;
          await supabase
            .from("workers")
            .update({ 
              rating: Number(avgRating.toFixed(1)),
              completed_jobs: wReviews.length 
            })
            .eq("id", workerId);
        }
      }

      toast({
        title: "Review submitted!",
        description: "Thank you for your feedback.",
      });
      onSuccess();
      onClose();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to submit review",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-background/80 backdrop-blur-sm"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="relative w-full max-w-lg overflow-hidden rounded-2xl bg-card border border-border shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <div className="sticky top-0 z-20 flex items-center justify-between border-b border-border/50 bg-card/80 backdrop-blur-md px-6 py-4">
              <h3 className="font-display text-xl font-bold">Rate Your Experience</h3>
              <button
                onClick={onClose}
                className="rounded-full p-2 text-muted-foreground hover:bg-muted transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* Provider Review Section */}
              <section className="space-y-6">
                <div className="text-center">
                  <p className="text-muted-foreground mb-1 text-sm">How was the service from</p>
                  <h4 className="text-xl font-bold text-primary">{providerName}</h4>
                </div>

                <div className="flex flex-col items-center">
                  <div className="flex gap-2 mb-2">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        type="button"
                        onMouseEnter={() => setHoveredRating(star)}
                        onMouseLeave={() => setHoveredRating(0)}
                        onClick={() => setRating(star)}
                        className="transition-transform active:scale-90"
                      >
                        <Star
                          className={`h-8 w-8 ${
                            star <= (hoveredRating || rating)
                              ? "fill-yellow-400 text-yellow-400"
                              : "text-muted-foreground/30"
                          } transition-colors`}
                        />
                      </button>
                    ))}
                  </div>
                  <p className="font-medium text-sm h-5 text-muted-foreground">
                    {(hoveredRating || rating) === 5 ? "Excellent! 🌟" : 
                     (hoveredRating || rating) === 4 ? "Very Good! ✨" : 
                     (hoveredRating || rating) === 3 ? "Good 👍" : 
                     (hoveredRating || rating) === 2 ? "Fair 😐" : "Poor 😞"}
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                    <MessageSquare className="h-3.5 w-3.5 text-primary" />
                    Provider Feedback
                  </label>
                  <textarea
                    value={comment}
                    onChange={(e) => setComment(e.target.value)}
                    placeholder="Share your thoughts on the overall service..."
                    className="w-full min-h-[100px] rounded-xl bg-muted/30 border border-border/50 p-4 focus:outline-none focus:ring-2 focus:ring-primary/50 transition-all resize-none text-sm"
                  />
                </div>
              </section>

              {/* Worker Review Section (Optional) */}
              {workerId && (
                <section className="space-y-6 pt-6 border-t border-border/50">
                  <div className="text-center">
                    <p className="text-muted-foreground mb-1 text-sm">Rate the worker</p>
                    <h4 className="text-xl font-bold text-accent">{workerName}</h4>
                  </div>

                  <div className="flex flex-col items-center">
                    <div className="flex gap-2 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <button
                          key={star}
                          type="button"
                          onMouseEnter={() => setHoveredWorkerRating(star)}
                          onMouseLeave={() => setHoveredWorkerRating(0)}
                          onClick={() => setWorkerRating(star)}
                          className="transition-transform active:scale-90"
                        >
                          <Star
                            className={`h-8 w-8 ${
                              star <= (hoveredWorkerRating || workerRating)
                                ? "fill-purple-400 text-purple-400"
                                : "text-muted-foreground/30"
                            } transition-colors`}
                          />
                        </button>
                      ))}
                    </div>
                    <p className="font-medium text-sm h-5 text-muted-foreground">
                      {(hoveredWorkerRating || workerRating) === 5 ? "Excellent Worker! 🏆" : 
                       (hoveredWorkerRating || workerRating) === 4 ? "Very Professional! ⭐" : 
                       (hoveredWorkerRating || workerRating) === 3 ? "Did a good job! ✅" : 
                       (hoveredWorkerRating || workerRating) === 2 ? "Could be better 👷" : "Unsatisfied 📉"}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
                      <MessageSquare className="h-3.5 w-3.5 text-accent" />
                      Worker Feedback
                    </label>
                    <textarea
                      value={workerComment}
                      onChange={(e) => setWorkerComment(e.target.value)}
                      placeholder={`Tell us how ${workerName} performed...`}
                      className="w-full min-h-[100px] rounded-xl bg-muted/30 border border-border/50 p-4 focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all resize-none text-sm"
                    />
                  </div>
                </section>
              )}

              <div className="flex gap-3 pt-4 sticky bottom-0 bg-card/80 backdrop-blur-md pb-2">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 rounded-xl border border-border px-4 py-3 font-medium hover:bg-muted transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="flex-[2] glow-button !py-3 flex items-center justify-center gap-2 text-sm"
                >
                  {loading ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    "Submit Review"
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};

export default ReviewModal;
