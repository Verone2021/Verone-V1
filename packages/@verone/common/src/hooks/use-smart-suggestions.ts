/**
 * 🧠 Hook Smart Suggestions - Intelligence Artificielle
 *
 * Système de suggestions intelligentes basé sur :
 * - Analyse des patterns existants
 * - Machine Learning simple sur les données
 * - Corrélations style/pièce/tags
 * - Popularité et tendances
 */

'use client';

import { useState, useEffect, useCallback } from 'react';

import { createClient } from '@verone/utils/supabase/client';
import type {
  CollectionSuggestion,
  CollectionStyle,
  RoomCategory,
} from '@verone/types';
import { COLLECTION_STYLE_OPTIONS, ROOM_CATEGORY_OPTIONS } from '@verone/types';

interface AnalyticsData {
  style_popularity: Record<CollectionStyle, number>;
  room_popularity: Record<RoomCategory, number>;
  style_room_correlations: Record<string, number>;
  popular_tags: Array<{
    tag: string;
    count: number;
    styles: CollectionStyle[];
  }>;
  style_tag_associations: Record<CollectionStyle, string[]>;
  room_tag_associations: Record<RoomCategory, string[]>;
}

interface SuggestionContext {
  style?: CollectionStyle | null;
  room_category?: RoomCategory | null;
  name?: string;
  description?: string;
  existing_tags?: string[];
}

export function useSmartSuggestions() {
  const [analytics, setAnalytics] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const supabase = createClient();

  // Analyser les données existantes pour créer l'intelligence
  const analyzeExistingData = useCallback(async () => {
    setLoading(true);
    setError(null);

    try {
      // 1. Récupérer toutes les collections existantes
      const { data: collections, error: collectionsError } = await supabase
        .from('collections')
        .select(
          'style, suitable_rooms, theme_tags, name, description, product_count'
        )
        .eq('is_active', true);

      if (collectionsError) throw collectionsError;

      if (!collections || collections.length === 0) {
        // Pas de données existantes, utiliser des valeurs par défaut
        setAnalytics(getDefaultAnalytics());
        return;
      }

      // 2. Analyser la popularité des styles
      const stylePopularity: Record<string, number> = {};
      const roomPopularity: Record<string, number> = {};
      const styleRoomPairs: Record<string, number> = {};
      const tagFrequency: Record<
        string,
        {
          count: number;
          styles: Set<CollectionStyle>;
          rooms: Set<RoomCategory>;
        }
      > = {};

      collections.forEach(collection => {
        // Popularité des styles
        if (collection.style) {
          stylePopularity[collection.style] =
            (stylePopularity[collection.style] ?? 0) + 1;
        }

        // Note: room_category a été remplacé par suitable_rooms (array)
        // La logique de popularité des pièces a été désactivée temporairement
        // TODO: Adapter pour suitable_rooms (multi-select)

        // Analyse des tags
        if (collection.theme_tags && collection.theme_tags.length > 0) {
          collection.theme_tags.forEach((tag: string) => {
            if (!tagFrequency[tag]) {
              tagFrequency[tag] = {
                count: 0,
                styles: new Set(),
                rooms: new Set(),
              };
            }
            tagFrequency[tag].count++;
            if (collection.style)
              tagFrequency[tag].styles.add(collection.style as CollectionStyle);
            // Note: room_category removed - TODO: adapt for suitable_rooms (array)
          });
        }
      });

      // 3. Calculer les associations style-tag et room-tag
      const styleTagAssociations = {} as Record<CollectionStyle, string[]>;
      const roomTagAssociations = {} as Record<RoomCategory, string[]>;

      // Initialiser avec tous les styles et pièces
      COLLECTION_STYLE_OPTIONS.forEach(option => {
        styleTagAssociations[option.value] = [];
      });
      ROOM_CATEGORY_OPTIONS.forEach(option => {
        roomTagAssociations[option.value] = [];
      });

      // Remplir les associations basées sur la fréquence
      Object.entries(tagFrequency).forEach(([tag, data]) => {
        data.styles.forEach(style => {
          if (data.count >= 2) {
            // Seuil minimum pour considérer une association
            styleTagAssociations[style].push(tag);
          }
        });
        data.rooms.forEach(room => {
          if (data.count >= 2) {
            roomTagAssociations[room].push(tag);
          }
        });
      });

      // 4. Trier les tags populaires
      const popularTags = Object.entries(tagFrequency)
        .map(([tag, data]) => ({
          tag,
          count: data.count,
          styles: Array.from(data.styles),
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 20); // Top 20 tags

      // 5. Construire les données d'analytics
      const analyticsData: AnalyticsData = {
        style_popularity: stylePopularity as Record<CollectionStyle, number>,
        room_popularity: roomPopularity as Record<RoomCategory, number>,
        style_room_correlations: styleRoomPairs,
        popular_tags: popularTags,
        style_tag_associations: styleTagAssociations,
        room_tag_associations: roomTagAssociations,
      };

      setAnalytics(analyticsData);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Erreur lors de l'analyse des données"
      );
      setAnalytics(getDefaultAnalytics());
    } finally {
      setLoading(false);
    }
  }, [supabase]);

  // Données par défaut si aucune collection n'existe
  const getDefaultAnalytics = (): AnalyticsData => ({
    style_popularity: {
      moderne: 3,
      minimaliste: 2,
      scandinave: 2,
      contemporain: 2,
      industriel: 1,
      classique: 1,
      boheme: 1,
      art_deco: 1,
    } as Record<CollectionStyle, number>,
    room_popularity: {
      salon: 3,
      chambre: 2,
      cuisine: 2,
      bureau: 1,
      salle_a_manger: 1,
      wc_salle_bain: 1,
      entree: 1,
      plusieurs_pieces: 1,
      exterieur_balcon: 1,
      exterieur_jardin: 1,
    } as Record<RoomCategory, number>,
    style_room_correlations: {
      'moderne:salon': 2,
      'minimaliste:bureau': 2,
      'scandinave:chambre': 2,
      'industriel:cuisine': 1,
    },
    popular_tags: [
      { tag: 'naturel', count: 3, styles: ['scandinave', 'boheme'] },
      { tag: 'épuré', count: 2, styles: ['minimaliste', 'moderne'] },
      { tag: 'chaleureux', count: 2, styles: ['scandinave', 'classique'] },
      { tag: 'élégant', count: 2, styles: ['contemporain', 'art_deco'] },
    ],
    style_tag_associations: {
      minimaliste: ['épuré', 'fonctionnel', 'blanc'],
      contemporain: ['élégant', 'tendance', 'design'],
      moderne: ['innovant', 'tech', 'géométrique'],
      scandinave: ['naturel', 'bois', 'chaleureux'],
      industriel: ['métal', 'brut', 'authentique'],
      classique: ['intemporel', 'raffiné', 'traditionnel'],
      boheme: ['coloré', 'libre', 'artistique'],
      art_deco: ['luxueux', 'doré', 'géométrique'],
    } as Record<CollectionStyle, string[]>,
    room_tag_associations: {
      salon: ['convivial', 'détente', 'famille'],
      chambre: ['repos', 'intime', 'cosy'],
      cuisine: ['fonctionnel', 'convivial', 'moderne'],
      bureau: ['productif', 'concentré', 'organisé'],
      salle_a_manger: ['réception', 'élégant', 'famille'],
      wc_salle_bain: ['relaxant', 'spa', 'bien-être'],
      entree: ['accueil', 'première impression', 'pratique'],
      plusieurs_pieces: ['harmonieux', 'cohérent', 'complet'],
      exterieur_balcon: ['extérieur', 'urban', 'plantes'],
      exterieur_jardin: ['nature', 'outdoor', 'verdure'],
    } as Record<RoomCategory, string[]>,
  });

  // Générer des suggestions basées sur le contexte
  const generateSuggestions = useCallback(
    (context: SuggestionContext): CollectionSuggestion[] => {
      if (!analytics) return [];

      const suggestions: CollectionSuggestion[] = [];

      // Note: Suggestions basées sur room_category désactivées
      // TODO: Adapter pour suitable_rooms (array multi-select)
      // 1. Suggestions de style basées sur la pièce - DISABLED
      // 2. Suggestions de pièce basées sur le style - DISABLED

      // 3. Suggestions de tags basées sur le style
      if (context.style) {
        const styleTags = analytics.style_tag_associations[context.style] ?? [];
        const filteredTags = styleTags
          .filter(tag => !context.existing_tags?.includes(tag))
          .slice(0, 5);

        filteredTags.forEach(tag => {
          suggestions.push({
            type: 'tag',
            value: tag,
            label: tag,
            confidence: 0.8,
            reason: `Tag populaire pour le style ${COLLECTION_STYLE_OPTIONS.find(s => s.value === context.style)?.label?.toLowerCase()}`,
          });
        });
      }

      // 4. Suggestions de tags basées sur la pièce - DISABLED
      // Note: room_category removed, TODO: adapt for suitable_rooms

      // 5. Suggestions de tags populaires génériques
      if (suggestions.filter(s => s.type === 'tag').length < 3) {
        const genericTags = analytics.popular_tags
          .filter(tagData => !context.existing_tags?.includes(tagData.tag))
          .filter(tagData => !suggestions.some(s => s.value === tagData.tag))
          .slice(0, 3);

        genericTags.forEach(tagData => {
          suggestions.push({
            type: 'tag',
            value: tagData.tag,
            label: tagData.tag,
            confidence: 0.6,
            reason: `Tag très populaire (utilisé dans ${tagData.count} collections)`,
          });
        });
      }

      // 6. Suggestions basées sur l'analyse textuelle du nom/description
      if (context.name ?? context.description) {
        const text =
          `${context.name ?? ''} ${context.description ?? ''}`.toLowerCase();

        // Mots-clés → suggestions de style
        const styleKeywords = {
          minimaliste: ['minimal', 'épuré', 'simple', 'blanc'],
          moderne: ['moderne', 'contemporain', 'tech', 'innovation'],
          scandinave: ['scandinave', 'nordique', 'hygge', 'bois', 'naturel'],
          industriel: ['industriel', 'métal', 'usine', 'brut', 'authentique'],
          boheme: ['bohème', 'boho', 'artistique', 'coloré', 'libre'],
          art_deco: ['art déco', 'luxe', 'doré', 'géométrique', 'gatsby'],
        };

        Object.entries(styleKeywords).forEach(([style, keywords]) => {
          const matches = keywords.filter(keyword => text.includes(keyword));
          if (matches.length > 0 && !context.style) {
            const styleOption = COLLECTION_STYLE_OPTIONS.find(
              s => s.value === style
            );
            if (styleOption && !suggestions.some(s => s.value === style)) {
              suggestions.push({
                type: 'style',
                value: style,
                label: styleOption.label,
                confidence: 0.85,
                reason: `Détecté dans votre description : "${matches[0]}"`,
              });
            }
          }
        });
      }

      // Trier par confiance décroissante
      return suggestions.sort((a, b) => b.confidence - a.confidence);
    },
    [analytics]
  );

  // Initialiser l'analyse au montage
  useEffect(() => {
    void analyzeExistingData();
  }, [analyzeExistingData]);

  return {
    analytics,
    loading,
    error,
    generateSuggestions,
    refreshAnalytics: analyzeExistingData,
  };
}
