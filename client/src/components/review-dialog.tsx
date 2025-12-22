import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { Star, Loader2 } from 'lucide-react';
import { api } from '@/lib/api';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import type { Review } from '@shared/schema';

interface ReviewDialogProps {
  job: { id: string; title: string };
  artisanId: string;
  artisanName: string;
  trigger?: React.ReactNode;
}

export function ReviewDialog({ job, artisanId, artisanName, trigger }: ReviewDialogProps) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoveredRating, setHoveredRating] = useState(0);
  const [comment, setComment] = useState('');
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: reviewStatus, isLoading: checkingReview } = useQuery({
    queryKey: ['/api/jobs', job.id, 'my-review'],
    queryFn: () => api.checkMyReview(job.id),
    enabled: open,
  });

  const createReviewMutation = useMutation({
    mutationFn: () => api.createReview({
      jobId: job.id,
      revieweeId: artisanId,
      rating,
      comment: comment.trim() || undefined,
    }),
    onSuccess: () => {
      toast({
        title: 'Review submitted',
        description: `Your review for ${artisanName} has been submitted.`,
      });
      queryClient.invalidateQueries({ queryKey: ['/api/jobs', job.id, 'my-review'] });
      queryClient.invalidateQueries({ queryKey: ['/api/users', artisanId, 'reviews'] });
      setOpen(false);
      setRating(0);
      setComment('');
    },
    onError: (error: any) => {
      toast({
        title: 'Error',
        description: error.message || 'Failed to submit review',
        variant: 'destructive',
      });
    },
  });

  const handleSubmit = () => {
    if (rating === 0) {
      toast({
        title: 'Rating required',
        description: 'Please select a rating before submitting.',
        variant: 'destructive',
      });
      return;
    }
    createReviewMutation.mutate();
  };

  const hasReviewed = reviewStatus?.hasReviewed;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button variant="outline" size="sm" data-testid={`button-review-artisan-${job.id}`}>
            <Star className="w-4 h-4 mr-1" />
            Rate Artisan
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Rate {artisanName}</DialogTitle>
          <DialogDescription>
            Share your experience with this artisan for the job: {job.title}
          </DialogDescription>
        </DialogHeader>

        {checkingReview ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : hasReviewed ? (
          <div className="py-6 text-center">
            <div className="flex justify-center mb-4">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-6 h-6 ${
                    star <= (reviewStatus?.review?.rating || 0)
                      ? 'text-yellow-500 fill-yellow-500'
                      : 'text-muted-foreground'
                  }`}
                />
              ))}
            </div>
            <p className="text-muted-foreground mb-2">You have already reviewed this artisan.</p>
            {reviewStatus?.review?.comment && (
              <p className="text-sm italic">"{reviewStatus.review.comment}"</p>
            )}
          </div>
        ) : (
          <div className="space-y-4 py-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Your Rating</label>
              <div className="flex gap-1" data-testid="rating-stars">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    onMouseEnter={() => setHoveredRating(star)}
                    onMouseLeave={() => setHoveredRating(0)}
                    className="p-1 transition-transform hover:scale-110"
                    data-testid={`rating-star-${star}`}
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= (hoveredRating || rating)
                          ? 'text-yellow-500 fill-yellow-500'
                          : 'text-muted-foreground'
                      }`}
                    />
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="text-sm font-medium mb-2 block">Your Review (optional)</label>
              <Textarea
                placeholder="Share details about your experience..."
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                rows={4}
                data-testid="input-review-comment"
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setOpen(false)} data-testid="button-cancel-review">
                Cancel
              </Button>
              <Button 
                onClick={handleSubmit} 
                disabled={createReviewMutation.isPending || rating === 0}
                data-testid="button-submit-review"
              >
                {createReviewMutation.isPending ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Submitting...
                  </>
                ) : (
                  'Submit Review'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

interface StarRatingProps {
  rating: number;
  reviewCount?: number;
  showCount?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export function StarRating({ rating, reviewCount = 0, showCount = true, size = 'md' }: StarRatingProps) {
  const sizeClasses = {
    sm: 'w-3 h-3',
    md: 'w-4 h-4',
    lg: 'w-5 h-5',
  };

  const textClasses = {
    sm: 'text-xs',
    md: 'text-sm',
    lg: 'text-base',
  };

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <Star
          key={star}
          className={`${sizeClasses[size]} ${
            star <= rating
              ? 'text-yellow-500 fill-yellow-500'
              : star <= rating + 0.5
              ? 'text-yellow-500 fill-yellow-200'
              : 'text-muted-foreground'
          }`}
        />
      ))}
      {showCount && (
        <span className={`${textClasses[size]} text-muted-foreground ml-1`}>
          {rating > 0 ? parseFloat(rating.toString()).toFixed(1) : 'New'}
          {reviewCount > 0 && ` (${reviewCount})`}
        </span>
      )}
    </div>
  );
}

interface ArtisanReviewsListProps {
  artisanId: string;
  artisanName?: string;
  showTitle?: boolean;
  maxReviews?: number;
}

export function ArtisanReviewsList({ artisanId, artisanName = 'Artisan', showTitle = true, maxReviews = 5 }: ArtisanReviewsListProps) {
  const { data: reviews, isLoading } = useQuery({
    queryKey: ['/api/users', artisanId, 'reviews'],
    queryFn: () => api.getUserReviews(artisanId),
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        {showTitle && <Skeleton className="h-6 w-32" />}
        <Skeleton className="h-24" />
        <Skeleton className="h-24" />
      </div>
    );
  }

  if (!reviews || reviews.length === 0) {
    return (
      <div className="text-center py-6 text-muted-foreground">
        <Star className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm">No reviews yet</p>
      </div>
    );
  }

  const displayedReviews = maxReviews ? reviews.slice(0, maxReviews) : reviews;
  const avgRating = reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length;

  return (
    <div className="space-y-4">
      {showTitle && (
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">Reviews for {artisanName}</h3>
          <StarRating rating={avgRating} reviewCount={reviews.length} size="sm" />
        </div>
      )}
      
      <div className="space-y-3">
        {displayedReviews.map((review) => (
          <div 
            key={review.id} 
            className="p-4 border rounded-lg space-y-2"
            data-testid={`review-item-${review.id}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Avatar className="w-8 h-8">
                  <AvatarFallback className="text-xs bg-primary/10 text-primary">
                    CL
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm font-medium">Client</span>
              </div>
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} showCount={false} size="sm" />
                <span className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(review.createdAt), { addSuffix: true })}
                </span>
              </div>
            </div>
            {review.comment && (
              <p className="text-sm text-muted-foreground pl-10">{review.comment}</p>
            )}
          </div>
        ))}
      </div>
      
      {reviews.length > maxReviews && (
        <p className="text-sm text-muted-foreground text-center">
          And {reviews.length - maxReviews} more review{reviews.length - maxReviews > 1 ? 's' : ''}
        </p>
      )}
    </div>
  );
}
