'use client';

import { useState } from 'react';

import { Star, Send } from 'lucide-react';

import {
  useProductReviews,
  useReviewStats,
  useSubmitReview,
} from '@/hooks/use-reviews';
import { useAuthUser } from '@/hooks/use-auth-user';

interface ProductReviewsProps {
  productId: string;
  productName: string;
}

function StarRating({
  rating,
  size = 'sm',
  interactive = false,
  onChange,
}: {
  rating: number;
  size?: 'sm' | 'md' | 'lg';
  interactive?: boolean;
  onChange?: (rating: number) => void;
}) {
  const sizeClass = { sm: 'h-3.5 w-3.5', md: 'h-4 w-4', lg: 'h-5 w-5' }[size];

  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map(star => (
        <button
          key={star}
          type="button"
          disabled={!interactive}
          onClick={() => onChange?.(star)}
          className={
            interactive
              ? 'cursor-pointer hover:scale-110 transition-transform'
              : 'cursor-default'
          }
        >
          <Star
            className={`${sizeClass} ${
              star <= rating
                ? 'fill-amber-400 text-amber-400'
                : 'fill-none text-verone-gray-300'
            }`}
          />
        </button>
      ))}
    </div>
  );
}

export function StarRatingDisplay({
  average,
  count,
}: {
  average: number;
  count: number;
}) {
  if (count === 0) return null;

  return (
    <div className="flex items-center gap-1.5">
      <StarRating rating={Math.round(average)} size="sm" />
      <span className="text-xs text-verone-gray-500">({count})</span>
    </div>
  );
}

export function ProductReviews({
  productId,
  productName,
}: ProductReviewsProps) {
  const { data: reviews = [], isLoading } = useProductReviews(productId);
  const { average, count } = useReviewStats(productId);
  const { user } = useAuthUser();
  const submitReview = useSubmitReview();

  const [showForm, setShowForm] = useState(false);
  const [formRating, setFormRating] = useState(5);
  const [formTitle, setFormTitle] = useState('');
  const [formComment, setFormComment] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    const authorName =
      [user.user_metadata.first_name, user.user_metadata.last_name]
        .filter(Boolean)
        .join(' ') || 'Client Vérone';

    void submitReview
      .mutateAsync({
        product_id: productId,
        user_id: user.id,
        author_name: authorName,
        rating: formRating,
        title: formTitle || undefined,
        comment: formComment || undefined,
      })
      .then(() => {
        setSubmitted(true);
        setShowForm(false);
        setFormTitle('');
        setFormComment('');
        setFormRating(5);
      })
      .catch((error: unknown) => {
        console.error('[ProductReviews] submit failed:', error);
      });
  };

  const inputClass =
    'w-full px-4 py-3 border border-verone-gray-300 rounded-lg focus:ring-2 focus:ring-verone-black focus:border-transparent outline-none transition-all text-sm';

  return (
    <section className="mt-16 pt-12 border-t border-verone-gray-200">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="font-playfair text-2xl font-bold text-verone-black">
            Avis clients
          </h2>
          {count > 0 && (
            <div className="flex items-center gap-2 mt-2">
              <StarRating rating={Math.round(average)} size="md" />
              <span className="text-sm text-verone-gray-600">
                {average.toFixed(1)} / 5 ({count} avis)
              </span>
            </div>
          )}
        </div>

        {user && !showForm && !submitted && (
          <button
            type="button"
            onClick={() => setShowForm(true)}
            className="px-5 py-2.5 border border-verone-black text-verone-black text-sm uppercase tracking-wide hover:bg-verone-black hover:text-verone-white transition-all duration-300"
          >
            Donner mon avis
          </button>
        )}
      </div>

      {/* Success message */}
      {submitted && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-8">
          <p className="text-sm text-green-800">
            Merci pour votre avis ! Il sera visible apr&egrave;s
            mod&eacute;ration.
          </p>
        </div>
      )}

      {/* Review form */}
      {showForm && user && (
        <form
          onSubmit={handleSubmit}
          className="border border-verone-gray-200 rounded-lg p-6 mb-8 space-y-4"
        >
          <h3 className="text-lg font-semibold text-verone-black">
            Votre avis sur {productName}
          </h3>

          <div>
            <label className="block text-sm font-medium text-verone-gray-700 mb-2">
              Note
            </label>
            <StarRating
              rating={formRating}
              size="lg"
              interactive
              onChange={setFormRating}
            />
          </div>

          <div>
            <label
              htmlFor="review-title"
              className="block text-sm font-medium text-verone-gray-700 mb-1.5"
            >
              Titre (optionnel)
            </label>
            <input
              id="review-title"
              type="text"
              value={formTitle}
              onChange={e => setFormTitle(e.target.value)}
              className={inputClass}
              placeholder="En quelques mots..."
            />
          </div>

          <div>
            <label
              htmlFor="review-comment"
              className="block text-sm font-medium text-verone-gray-700 mb-1.5"
            >
              Votre avis
            </label>
            <textarea
              id="review-comment"
              value={formComment}
              onChange={e => setFormComment(e.target.value)}
              rows={4}
              className={inputClass}
              placeholder="Partagez votre exp&eacute;rience avec ce produit..."
            />
          </div>

          <div className="flex items-center gap-3">
            <button
              type="submit"
              disabled={submitReview.isPending}
              className="flex items-center gap-2 bg-verone-black text-verone-white px-6 py-2.5 rounded-lg font-medium hover:bg-verone-gray-800 transition-colors text-sm disabled:opacity-50"
            >
              <Send className="h-4 w-4" />
              {submitReview.isPending ? 'Envoi...' : 'Publier mon avis'}
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="text-sm text-verone-gray-500 hover:text-verone-black transition-colors"
            >
              Annuler
            </button>
          </div>
        </form>
      )}

      {/* Reviews list */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className="animate-pulse border border-verone-gray-100 rounded-lg p-6"
            >
              <div className="h-4 bg-verone-gray-200 rounded w-1/4 mb-3" />
              <div className="h-3 bg-verone-gray-100 rounded w-3/4" />
            </div>
          ))}
        </div>
      ) : reviews.length > 0 ? (
        <div className="space-y-4">
          {reviews.map(review => (
            <div
              key={review.id}
              className="border border-verone-gray-100 rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-3">
                  <StarRating rating={review.rating} size="sm" />
                  <span className="text-sm font-medium text-verone-black">
                    {review.author_name}
                  </span>
                </div>
                <span className="text-xs text-verone-gray-400">
                  {new Date(review.created_at).toLocaleDateString('fr-FR', {
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                  })}
                </span>
              </div>
              {review.title && (
                <h4 className="text-sm font-semibold text-verone-black mb-1">
                  {review.title}
                </h4>
              )}
              {review.comment && (
                <p className="text-sm text-verone-gray-600 leading-relaxed">
                  {review.comment}
                </p>
              )}
            </div>
          ))}
        </div>
      ) : (
        !submitted && (
          <div className="text-center py-12 border border-verone-gray-100 rounded-lg">
            <Star className="h-8 w-8 text-verone-gray-300 mx-auto mb-3" />
            <p className="text-sm text-verone-gray-500">
              Aucun avis pour le moment.
            </p>
            {user && (
              <button
                type="button"
                onClick={() => setShowForm(true)}
                className="mt-3 text-sm font-medium text-verone-black hover:underline"
              >
                Soyez le premier &agrave; donner votre avis
              </button>
            )}
          </div>
        )
      )}
    </section>
  );
}
