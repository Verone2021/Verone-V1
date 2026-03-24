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

export function ReviewsSection() {
  const supabase = createClient();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  // Fetch all reviews
  const { data: reviews = [], isLoading } = useQuery({
    queryKey: ['site-reviews-bo'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('product_reviews')
        .select(
          'id, product_id, user_id, author_name, rating, title, comment, status, created_at, updated_at'
        )
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

  // Update review status mutation
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
      await queryClient.invalidateQueries({
        queryKey: ['site-reviews-bo'],
      });
      toast.success(
        variables.newStatus === 'approved'
          ? 'Avis approuv\u00e9'
          : 'Avis rejet\u00e9'
      );
    },
    onError: (error: Error) => {
      console.error('[ReviewsSection] update error:', error);
      toast.error('Erreur lors de la mise \u00e0 jour');
    },
  });

  const handleApprove = useCallback(
    (reviewId: string) => {
      updateStatus.mutate({ reviewId, newStatus: 'approved' });
    },
    [updateStatus]
  );

  const handleReject = useCallback(
    (reviewId: string) => {
      updateStatus.mutate({ reviewId, newStatus: 'rejected' });
    },
    [updateStatus]
  );

  // Filtered reviews
  const filteredReviews = useMemo(() => {
    let result = reviews;

    if (statusFilter !== 'all') {
      result = result.filter(r => r.status === statusFilter);
    }

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
  }, [reviews, statusFilter, searchQuery]);

  // Stats
  const stats = useMemo(() => {
    const pending = reviews.filter(r => r.status === 'pending').length;
    const approved = reviews.filter(r => r.status === 'approved').length;
    const rejected = reviews.filter(r => r.status === 'rejected').length;
    const avgRating =
      reviews.length > 0
        ? reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length
        : 0;
    return { total: reviews.length, pending, approved, rejected, avgRating };
  }, [reviews]);

  const statusBadge = (status: string) => {
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
            <CheckCircle className="h-3 w-3 mr-1" /> Approuv\u00e9
          </Badge>
        );
      case 'rejected':
        return (
          <Badge variant="outline" className="bg-red-50 text-red-700">
            <XCircle className="h-3 w-3 mr-1" /> Rejet\u00e9
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const renderStars = (rating: number) => (
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

  return (
    <div className="space-y-6">
      {/* Stats */}
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
            <div className="text-sm text-muted-foreground">Approuv\u00e9s</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold text-red-600">
              {stats.rejected}
            </div>
            <div className="text-sm text-muted-foreground">Rejet\u00e9s</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-4 pb-4">
            <div className="text-2xl font-bold">
              {stats.avgRating.toFixed(1)}
            </div>
            <div className="text-sm text-muted-foreground">Note moyenne</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
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
                onChange={e => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrer par statut" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="pending">En attente</SelectItem>
                <SelectItem value="approved">Approuv\u00e9s</SelectItem>
                <SelectItem value="rejected">Rejet\u00e9s</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {isLoading ? (
            <div className="text-center py-8 text-muted-foreground">
              Chargement...
            </div>
          ) : filteredReviews.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              Aucun avis trouv\u00e9
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>Auteur</TableHead>
                  <TableHead>Note</TableHead>
                  <TableHead>Titre / Commentaire</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredReviews.map(review => (
                  <TableRow key={review.id}>
                    <TableCell className="text-sm text-muted-foreground whitespace-nowrap">
                      {new Date(review.created_at).toLocaleDateString('fr-FR')}
                    </TableCell>
                    <TableCell className="font-medium">
                      {review.author_name}
                    </TableCell>
                    <TableCell>{renderStars(review.rating)}</TableCell>
                    <TableCell className="max-w-xs">
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
                      {review.status === 'pending' && (
                        <div className="flex items-center justify-end gap-1">
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            onClick={() => handleApprove(review.id)}
                            disabled={updateStatus.isPending}
                            className="text-green-600 hover:text-green-700 hover:bg-green-50"
                          >
                            <CheckCircle className="h-4 w-4" />
                          </ButtonV2>
                          <ButtonV2
                            variant="ghost"
                            size="sm"
                            onClick={() => handleReject(review.id)}
                            disabled={updateStatus.isPending}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <XCircle className="h-4 w-4" />
                          </ButtonV2>
                        </div>
                      )}
                      {review.status !== 'pending' && (
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          onClick={() =>
                            updateStatus.mutate({
                              reviewId: review.id,
                              newStatus:
                                review.status === 'approved'
                                  ? 'rejected'
                                  : 'approved',
                            })
                          }
                          disabled={updateStatus.isPending}
                          className="text-muted-foreground"
                        >
                          {review.status === 'approved'
                            ? 'Rejeter'
                            : 'Approuver'}
                        </ButtonV2>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
