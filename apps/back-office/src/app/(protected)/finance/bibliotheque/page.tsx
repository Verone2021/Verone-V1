'use client';

/**
 * Page Bibliothèque de Documents
 *
 * Vue complète du stockage Supabase Storage :
 * - Stats par bucket (nombre de fichiers, taille)
 * - Vue par année/mois pour le bucket justificatifs
 * - Liste des fichiers avec actions (télécharger, supprimer)
 */

import { useState, useEffect, useMemo, useCallback } from 'react';

import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
  Badge,
  Button,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  ScrollArea,
  Alert,
  AlertDescription,
} from '@verone/ui';
import { KpiCard, KpiGrid } from '@verone/ui-business';
import { createClient } from '@verone/utils/supabase/client';
import {
  FolderArchive,
  FileText,
  Image,
  Download,
  Trash2,
  Calendar,
  HardDrive,
  RefreshCw,
  Search,
  Info,
  File,
  FileImage,
} from 'lucide-react';
import { toast } from 'sonner';

// =====================================================================
// TYPES
// =====================================================================

interface BucketStats {
  name: string;
  fileCount: number;
  totalSize: number;
  label: string;
  icon: 'image' | 'document' | 'archive';
}

interface StorageFile {
  id: string;
  name: string;
  bucket_id: string;
  created_at: string;
  updated_at: string;
  metadata: {
    size?: number;
    mimetype?: string;
  };
}

// =====================================================================
// HELPERS
// =====================================================================

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function getFileIcon(mimetype: string | undefined) {
  if (mimetype?.startsWith('image/')) return FileImage;
  if (mimetype === 'application/pdf') return FileText;
  return File;
}

const BUCKET_CONFIG: Record<
  string,
  { label: string; icon: 'image' | 'document' | 'archive' }
> = {
  justificatifs: { label: 'Justificatifs comptables', icon: 'archive' },
  'product-images': { label: 'Images produits', icon: 'image' },
  'organisation-logos': { label: 'Logos organisations', icon: 'image' },
  'family-images': { label: 'Images familles', icon: 'image' },
  'category-images': { label: 'Images catégories', icon: 'image' },
  'collection-images': { label: 'Images collections', icon: 'image' },
  'affiliate-products': { label: 'Produits affiliés', icon: 'image' },
  'linkme-delivery-forms': {
    label: 'Bons de livraison LinkMe',
    icon: 'document',
  },
};

// =====================================================================
// HOOK: useStorageStats
// =====================================================================

function useStorageStats() {
  const [bucketStats, setBucketStats] = useState<BucketStats[]>([]);
  const [files, setFiles] = useState<StorageFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBucket, setSelectedBucket] = useState<string>('justificatifs');

  const supabase = useMemo(() => createClient(), []);

  const fetchBucketStats = useCallback(async () => {
    setLoading(true);
    try {
      // Fetch all buckets
      const { data: buckets } = await supabase.storage.listBuckets();
      if (!buckets) return;

      const stats: BucketStats[] = [];
      for (const bucket of buckets) {
        const { data: objects } = await supabase.storage
          .from(bucket.name)
          .list('', { limit: 1000 });

        const config = BUCKET_CONFIG[bucket.name] ?? {
          label: bucket.name,
          icon: 'document' as const,
        };

        // Recursive count for nested folders
        let fileCount = 0;
        let totalSize = 0;

        if (objects) {
          for (const obj of objects) {
            if (obj.metadata) {
              fileCount++;
              totalSize += (obj.metadata as { size?: number }).size ?? 0;
            }
          }
        }

        stats.push({
          name: bucket.name,
          fileCount,
          totalSize,
          label: config.label,
          icon: config.icon,
        });
      }

      setBucketStats(stats.sort((a, b) => b.fileCount - a.fileCount));
    } catch (err) {
      console.error('[Bibliothèque] Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  const fetchFiles = useCallback(
    async (bucket: string, path = '') => {
      try {
        const { data, error } = await supabase.storage
          .from(bucket)
          .list(path, {
            limit: 500,
            sortBy: { column: 'created_at', order: 'desc' },
          });

        if (error) {
          console.error('[Bibliothèque] Error listing files:', error);
          return;
        }

        // Handle folders recursively
        const allFiles: StorageFile[] = [];
        if (data) {
          for (const item of data) {
            if (item.id) {
              // It's a file
              allFiles.push({
                id: item.id,
                name: path ? `${path}/${item.name}` : item.name,
                bucket_id: bucket,
                created_at: item.created_at,
                updated_at: item.updated_at,
                metadata: (item.metadata ?? {}) as {
                  size?: number;
                  mimetype?: string;
                },
              });
            } else {
              // It's a folder — recurse
              const subPath = path ? `${path}/${item.name}` : item.name;
              const { data: subData } = await supabase.storage
                .from(bucket)
                .list(subPath, {
                  limit: 500,
                  sortBy: { column: 'created_at', order: 'desc' },
                });
              if (subData) {
                for (const subItem of subData) {
                  if (subItem.id) {
                    allFiles.push({
                      id: subItem.id,
                      name: `${subPath}/${subItem.name}`,
                      bucket_id: bucket,
                      created_at: subItem.created_at,
                      updated_at: subItem.updated_at,
                      metadata: (subItem.metadata ?? {}) as {
                        size?: number;
                        mimetype?: string;
                      },
                    });
                  }
                }
              }
            }
          }
        }

        setFiles(allFiles);
      } catch (err) {
        console.error('[Bibliothèque] Error fetching files:', err);
      }
    },
    [supabase]
  );

  useEffect(() => {
    void fetchBucketStats();
  }, [fetchBucketStats]);

  useEffect(() => {
    void fetchFiles(selectedBucket);
  }, [selectedBucket, fetchFiles]);

  return {
    bucketStats,
    files,
    loading,
    selectedBucket,
    setSelectedBucket,
    refresh: () => {
      void fetchBucketStats();
      void fetchFiles(selectedBucket);
    },
    supabase,
  };
}

// =====================================================================
// PAGE
// =====================================================================

export default function BibliothequeDocumentsPage() {
  const {
    bucketStats,
    files,
    loading,
    selectedBucket,
    setSelectedBucket,
    refresh,
    supabase,
  } = useStorageStats();

  const [search, setSearch] = useState('');
  const [yearFilter, setYearFilter] = useState<string>('all');

  // Stats globales
  const totalFiles = bucketStats.reduce((sum, b) => sum + b.fileCount, 0);
  const totalSize = bucketStats.reduce((sum, b) => sum + b.totalSize, 0);
  const justificatifsStats = bucketStats.find(b => b.name === 'justificatifs');

  // Filtrer les fichiers
  const filteredFiles = useMemo(() => {
    let result = files;

    if (search) {
      const q = search.toLowerCase();
      result = result.filter(f => f.name.toLowerCase().includes(q));
    }

    if (yearFilter !== 'all') {
      result = result.filter(f => {
        // Filter by year in path (justificatifs/2026/...) or created_at
        return (
          f.name.startsWith(`${yearFilter}/`) ||
          f.created_at?.startsWith(yearFilter)
        );
      });
    }

    return result;
  }, [files, search, yearFilter]);

  // Grouper par année/mois pour stats
  const filesByYear = useMemo(() => {
    const groups: Record<string, { count: number; size: number }> = {};
    files.forEach(f => {
      // Try to extract year from path first (justificatifs/2026/03/...)
      const pathMatch = f.name.match(/^(\d{4})\//);
      const year = pathMatch
        ? pathMatch[1]
        : (f.created_at?.substring(0, 4) ?? 'unknown');
      if (!groups[year]) groups[year] = { count: 0, size: 0 };
      groups[year].count++;
      groups[year].size += f.metadata?.size ?? 0;
    });
    return Object.entries(groups).sort(([a], [b]) => b.localeCompare(a));
  }, [files]);

  // Download file
  const handleDownload = async (file: StorageFile) => {
    try {
      const { data, error } = await supabase.storage
        .from(file.bucket_id)
        .download(file.name);

      if (error) {
        toast.error('Erreur lors du téléchargement');
        return;
      }

      const url = URL.createObjectURL(data);
      const a = document.createElement('a');
      a.href = url;
      a.download = file.name.split('/').pop() ?? 'document';
      a.click();
      URL.revokeObjectURL(url);
      toast.success('Fichier téléchargé');
    } catch {
      toast.error('Erreur lors du téléchargement');
    }
  };

  // Delete file
  const handleDelete = async (file: StorageFile) => {
    if (!confirm(`Supprimer "${file.name.split('/').pop()}" ?`)) return;

    try {
      const { error } = await supabase.storage
        .from(file.bucket_id)
        .remove([file.name]);

      if (error) {
        toast.error('Erreur lors de la suppression');
        return;
      }

      toast.success('Fichier supprimé');
      refresh();
    } catch {
      toast.error('Erreur lors de la suppression');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <FolderArchive className="h-6 w-6" />
            Bibliothèque de documents
          </h1>
          <p className="text-muted-foreground">
            Gestion du stockage et des fichiers
          </p>
        </div>
        <Button variant="outline" size="sm" onClick={refresh} className="gap-2">
          <RefreshCw className="h-4 w-4" />
          Actualiser
        </Button>
      </div>

      {/* KPIs globaux */}
      <KpiGrid columns={4}>
        <KpiCard
          title="Total fichiers"
          value={totalFiles}
          valueType="number"
          icon={<FileText className="h-4 w-4" />}
        />
        <KpiCard
          title="Espace utilisé"
          value={formatFileSize(totalSize)}
          icon={<HardDrive className="h-4 w-4" />}
        />
        <KpiCard
          title="Justificatifs"
          value={justificatifsStats?.fileCount ?? 0}
          valueType="number"
          icon={<FolderArchive className="h-4 w-4" />}
          variant={justificatifsStats?.fileCount ? 'success' : 'default'}
        />
        <KpiCard
          title="Buckets actifs"
          value={bucketStats.filter(b => b.fileCount > 0).length}
          valueType="number"
          icon={<HardDrive className="h-4 w-4" />}
        />
      </KpiGrid>

      {/* Vue par bucket */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Stockage par catégorie</CardTitle>
          <CardDescription>
            Répartition des fichiers par bucket Supabase Storage
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-8 gap-3">
              <div className="h-5 w-5 animate-spin rounded-full border-2 border-primary border-t-transparent" />
              <span className="text-muted-foreground">Chargement...</span>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {bucketStats.map(bucket => (
                <button
                  key={bucket.name}
                  onClick={() => setSelectedBucket(bucket.name)}
                  className={`p-4 rounded-lg border text-left transition-all hover:shadow-md ${
                    selectedBucket === bucket.name
                      ? 'border-primary bg-primary/5 shadow-sm'
                      : 'border-border hover:border-primary/50'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-2">
                    {bucket.icon === 'image' ? (
                      <Image className="h-5 w-5 text-blue-500" />
                    ) : bucket.icon === 'archive' ? (
                      <FolderArchive className="h-5 w-5 text-amber-500" />
                    ) : (
                      <FileText className="h-5 w-5 text-slate-500" />
                    )}
                    <span className="font-medium text-sm truncate">
                      {bucket.label}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <Badge variant="secondary" className="text-xs">
                      {bucket.fileCount} fichiers
                    </Badge>
                    <span className="text-xs text-muted-foreground">
                      {formatFileSize(bucket.totalSize)}
                    </span>
                  </div>
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Stats par année (pour le bucket sélectionné) */}
      {filesByYear.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Répartition par année —{' '}
              {BUCKET_CONFIG[selectedBucket]?.label ?? selectedBucket}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {filesByYear.map(([year, stats]) => (
                <div
                  key={year}
                  className="p-3 border rounded-lg bg-muted/30 cursor-pointer hover:bg-muted/50 transition-colors"
                  onClick={() =>
                    setYearFilter(year === yearFilter ? 'all' : year)
                  }
                >
                  <div className="font-bold text-lg">{year}</div>
                  <div className="text-sm text-muted-foreground">
                    {stats.count} fichier{stats.count > 1 ? 's' : ''} —{' '}
                    {formatFileSize(stats.size)}
                  </div>
                  {yearFilter === year && (
                    <Badge variant="default" className="mt-1 text-xs">
                      Filtré
                    </Badge>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Liste des fichiers */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">
                Fichiers —{' '}
                {BUCKET_CONFIG[selectedBucket]?.label ?? selectedBucket}
              </CardTitle>
              <CardDescription>
                {filteredFiles.length} fichier
                {filteredFiles.length > 1 ? 's' : ''}
                {yearFilter !== 'all' ? ` (${yearFilter})` : ''}
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher..."
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  className="pl-9 pr-3 py-2 border rounded-lg text-sm w-48"
                />
              </div>
              <Select value={yearFilter} onValueChange={setYearFilter}>
                <SelectTrigger className="w-36">
                  <SelectValue placeholder="Année" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Toutes les années</SelectItem>
                  {filesByYear.map(([year]) => (
                    <SelectItem key={year} value={year}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredFiles.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <FolderArchive className="h-12 w-12 mx-auto mb-4 opacity-30" />
              <p>Aucun fichier dans ce bucket</p>
              {selectedBucket === 'justificatifs' && (
                <Alert className="mt-4 border-blue-200 bg-blue-50 max-w-md mx-auto">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertDescription className="text-blue-700 text-sm">
                    Les prochains justificatifs uploadés sur les transactions
                    seront automatiquement stockés ici en plus de Qonto.
                  </AlertDescription>
                </Alert>
              )}
            </div>
          ) : (
            <ScrollArea className="h-[500px]">
              <div className="border rounded-lg overflow-hidden">
                <div className="grid grid-cols-12 gap-2 px-4 py-3 bg-muted/50 text-xs font-medium text-muted-foreground border-b uppercase tracking-wide">
                  <div className="col-span-1" />
                  <div className="col-span-5">Nom du fichier</div>
                  <div className="col-span-2">Date</div>
                  <div className="col-span-2 text-right">Taille</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
                {filteredFiles.map(file => {
                  const FileIcon = getFileIcon(file.metadata?.mimetype);
                  return (
                    <div
                      key={file.id}
                      className="grid grid-cols-12 gap-2 px-4 py-3 border-b hover:bg-muted/30 transition-colors items-center"
                    >
                      <div className="col-span-1">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                      </div>
                      <div className="col-span-5">
                        <div className="font-medium text-sm truncate">
                          {file.name.split('/').pop()}
                        </div>
                        <div className="text-xs text-muted-foreground truncate">
                          {file.name}
                        </div>
                      </div>
                      <div className="col-span-2 text-sm text-muted-foreground">
                        {formatDate(file.created_at)}
                      </div>
                      <div className="col-span-2 text-right text-sm text-muted-foreground">
                        {file.metadata?.size
                          ? formatFileSize(file.metadata.size)
                          : '-'}
                      </div>
                      <div className="col-span-2 text-right flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void handleDownload(file);
                          }}
                          title="Télécharger"
                        >
                          <Download className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            void handleDelete(file);
                          }}
                          title="Supprimer"
                          className="text-red-500 hover:text-red-700"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
