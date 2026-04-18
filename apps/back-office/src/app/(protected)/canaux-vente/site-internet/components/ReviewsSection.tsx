'use client';

import { useCallback, useMemo, useState } from 'react';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Input,
  Badge,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@verone/ui';
import { ButtonV2 } from '@verone/ui';
import {
  CheckCircle,
  XCircle,
  Star,
  Clock,
  MessageSquare,
  Search,
} from 'lucide-react';
import { toast } from 'sonner';

import { createClient } from '@verone/utils/supabase/client';

// ============================================
// Reviews Stats Grid
// ============================================

interface ReviewsStatsGridProps {
  stats: {
    total: number;
    pending: number;
    approved: number;
    rejected: number;
    avgRating: number;
  };
}

function ReviewsStatsGrid({ stats }: ReviewsStatsGridProps) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{stats.total}</div>
          <div className="text-sm text-muted-foreground">Total avis</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-yellow-600">
            {stats.pending}
          </div>
          <div className="text-sm text-muted-foreground">En attente</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-green-600">
            {stats.approved}
          </div>
          <div className="text-sm text-muted-foreground">Approuvés</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold text-red-600">
            {stats.rejected}
          </div>
          <div className="text-sm text-muted-foreground">Rejetés</div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="text-2xl font-bold">{stats.avgRating.toFixed(1)}</div>
          <div className="text-sm text-muted-foreground">Note moyenne</div>
        </CardContent>
      </Card>
    </div>
  );
}

// ============================================
// Types & Helpers
// ============================================

interface ProductReview {
  id: string;
  product_id: string;
  user_id: string | null;
  author_name: string;
  rating: number;
  title: string | null;
  comment: string | null;
  status: 'pending' | 'approved' | 'rejected';
  created_at: string;
  updated_at: string;
}

function statusBadge(status: string) {
  switch (status) {
    case 'pending':
      return (
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700">
          <Clock className="h-3 w-3 mr-1" /> En attente
        </Badge>
      );
    case 'approved':
      return (
        <Badge variant="outline" className="bg-green-50 text-green-700">
          <CheckCircle className="h-3 w-3 mr-1" /> Approuvé
        </Badge>
      );
    case 'rejected':
      return (
        <Badge variant="outline" className="bg-red-50 text-red-700">
          <XCircle className="h-3 w-3 mr-1" /> Rejeté
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
}

function renderStars(rating: number) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
          }`}
        />
      ))}
    </div>
  );
}

// ============================================
// Reviews Table
// ============================================

interface ReviewsTableProps {
  filteredReviews: ProductReview[];
  isLoading: boolean;
  searchQuery: string;
  statusFilter: string;
  onSearchChange: (v: string) => void;
  onStatusFilterChange: (v: string) => void;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggle: (review: ProductReview) => void;
  isPending: boolean;
}

function ReviewsTable({
  filteredReviews,
  isLoading,
  searchQuery,
  statusFilter,
  onSearchChange,
  onStatusFilterChange,
  onApprove,
  onReject,
  onToggle,
  isPending,
}: ReviewsTableProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <MessageSquare className="h-5 w-5" />
          Avis clients
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center gap-4 mb-4">
          <div className="relative flex-1 max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un avis..."
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={onStatusFilterChange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrer par statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              <SelectItem value="pending">En attente</SelectItem>
              <SelectItem value="approved">Approuvés</SelectItem>
              <SelectItem value="rejected">Rejetés</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">
            Chargement...
          </div>
        ) : filteredReviews.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            Aucun avis trouvé
          </div>
        ) : (
          <ReviewsTableBody
            filteredReviews={filteredReviews}
            onApprove={onApprove}
            onReject={onReject}
            onToggle={onToggle}
            isPending={isPending}
          />
        )}
      </CardContent>
    </Card>
  );
}

// ============================================
// Reviews Table Body
// ============================================

interface ReviewsTableBodyProps {
  filteredReviews: ProductReview[];
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggle: (review: ProductReview) => void;
  isPending: boolean;
}

interface ReviewActionCellProps {
  review: ProductReview;
  onApprove: (id: string) => void;
  onReject: (id: string) => void;
  onToggle: (review: ProductReview) => void;
  isPending: boolean;
}

function ReviewActionCell({
  review,
  onApprove,
  onReject,
  onToggle,
  isPending,
}: ReviewActionCellProps) {
  if (review.status === 'pending') {
    return (
      <div className="flex items-center justify-end gap-1">
        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={() => onApprove(review.id)}
          disabled={isPending}
          className="text-green-600 hover:text-green-700 hover:bg-green-50"
        >
          <CheckCircle className="h-4 w-4" />
        </ButtonV2>
        <ButtonV2
          variant="ghost"
          size="sm"
          onClick={() => onReject(review.id)}
          disabled={isPending}
          className="text-red-600 hover:text-red-700 hover:bg-red-50"
        >
          <XCircle className="h-4 w-4" />
        </ButtonV2>
      </div>
    );
  }
  return (
    <ButtonV2
      variant="ghost"
      size="sm"
      onClick={() => onToggle(review)}
      disabled={isPending}
      className="text-muted-foreground"
    >
      {review.status === 'approved' ? 'Rejeter' : 'Approuver'}
    </ButtonV2>
  );
}

function ReviewsTableBody({
  filteredReviews,
  onApprove,
  onReject,
  onToggle,
  isPending,
}: ReviewsTableBodyProps) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="hidden lg:table-cell">Date</TableHead>
          <TableHead>Auteur</TableHead>
          <TableHead className="hidden lg:table-cell">Note</TableHead>
          <TableHead className="hidden xl:table-cell">Titre / Commentaire</TableHead>
          <TableHead>Statut</TableHead>
          <TableHead className="text-right">Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {filteredReviews.map(review => (
          <TableRow key={review.id}>
            <TableCell className="hidden lg:table-cell text-sm text-muted-foreground whitespace-nowrap">
              {new Date(review.created_at).toLocaleDateString('fr-FR')}
            </TableCell>
            <TableCell className="font-medium">{review.author_name}</TableCell>
            <TableCell className="hidden lg:table-cell">{renderStars(review.rating)}</TableCell>
            <TableCell className="hidden xl:table-cell max-w-xs">
              {review.title && (
                <p className="font-medium text-sm">{review.title}</p>
              )}
              {review.comment && (
                <p className="text-sm text-muted-foreground line-clamp-2">
                  {review.comment}
                </p>
              )}
            </TableCell>
            <TableCell>{statusBadge(review.status)}</TableCell>
            <TableCell className="text-right">
              <ReviewActionCell
                review={review}
                onApprove={onApprove}
                onReject={onReject}
                onToggle={onToggle}
                isPending={isPending}
              />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

// ============================================
// Helpers & Hooks
// ============================================

function filterReviews(
  reviews: ProductReview[],
  statusFilter: string,
  searchQuery: string
) {
  let result = reviews;
  if (statusFilter !== 'all')
    result = result.filter(r => r.status === statusFilter);
  if (searchQuery) {
    const q = searchQuery.toLowerCase();
    result = result.filter(
      r =>
        r.author_name.toLowerCase().includes(q) ||
        (r.title?.toLowerCase().includes(q) ?? false) ||
        (r.comment?.toLowerCase().includes(q) ?? false)
    );
  }
  return result;
}

function computeReviewsStats(reviews: ProductReview[]) {
  const pending = reviews.filter(r => r.status === 'pending').length;
  const approved = reviews.filter(r => r.status === 'approved').length;
  const rejected = reviews.filter(r => r.status === 'rejected').length;
  const avgRating =
    reviews.length > 0
      ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
      : 0;
  return { total: reviews.length, pending, approved, rejected, avgRating };
}

function useReviews() {
  const supabase = createClient();
  const queryClient = useQueryClient();

  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['site-reviews-bo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) {
        console.error('[ReviewsSection] fetch error:', error);
        throw error;
      }
      return (data ?? []) as ProductReview[];
    },
    staleTime: 30_000,
  });

  const updateStatus = useMutation({
    mutationFn: async ({
      reviewId,
      newStatus,
    }: {
      reviewId: string;
      newStatus: 'approved' | 'rejected';
    }) => {
      const { error } = await supabase
        .from('product_reviews')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .eq('id', reviewId);
      if (error) throw error;
    },
    onSuccess: async (_data, variables) => {
      await queryClient.invalidateQueries({ queryKey: ['site-reviews-bo'] });
      toast.success(
        variables.newStatus === 'approved' ? 'Avis approuvé' : 'Avis rejeté'
      );
    },
    onError: (error: Error) => {
      console.error('[ReviewsSection] update error:', error);
      toast.error('Erreur lors de la mise à jour');
    },
  });

  return { reviews, isLoading, updateStatus };
}

// ============================================
// Main Export
// ============================================

export function ReviewsSection() {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const { reviews, isLoading, updateStatus } = useReviews();

  const handleApprove = useCallback(
    (reviewId: string) =>
      updateStatus.mutate({ reviewId, newStatus: 'approved' }),
    [updateStatus]
  );

  const handleReject = useCallback(
    (reviewId: string) =>
      updateStatus.mutate({ reviewId, newStatus: 'rejected' }),
    [updateStatus]
  );

  const handleToggle = useCallback(
    (review: ProductReview) => {
      const newStatus = review.status === 'approved' ? 'rejected' : 'approved';
      updateStatus.mutate({ reviewId: review.id, newStatus });
    },
    [updateStatus]
  );

  const filteredReviews = useMemo(
    () => filterReviews(reviews, statusFilter, searchQuery),
    [reviews, statusFilter, searchQuery]
  );
  const stats = useMemo(() => computeReviewsStats(reviews), [reviews]);

  return (
    <div className="space-y-6">
      <ReviewsStatsGrid stats={stats} />
      <ReviewsTable
        filteredReviews={filteredReviews}
        isLoading={isLoading}
        searchQuery={searchQuery}
        statusFilter={statusFilter}
        onSearchChange={setSearchQuery}
        onStatusFilterChange={setStatusFilter}
        onApprove={handleApprove}
        onReject={handleReject}
        onToggle={handleToggle}
        isPending={updateStatus.isPending}
      />
    </div>
  );
}
