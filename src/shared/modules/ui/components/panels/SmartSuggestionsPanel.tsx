'use client';

import { useEffect, useState } from 'react';

import {
  Lightbulb,
  Sparkles,
  TrendingUp,
  Target,
  Brain,
  ChevronRight,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { ButtonV2 } from '@/components/ui/button';
import { cn } from '@verone/utils';
import { useSmartSuggestions } from '@/shared/modules/common/hooks';
import type {
  CollectionSuggestion,
  CollectionStyle,
  RoomCategory,
} from '@verone/types';
import {
  COLLECTION_STYLE_OPTIONS,
  ROOM_CATEGORY_OPTIONS,
} from '@verone/types';

interface SmartSuggestionsPanelProps {
  context: {
    style?: CollectionStyle | null;
    room_category?: RoomCategory | null;
    name?: string;
    description?: string;
    existing_tags?: string[];
  };
  onApplySuggestion: (type: 'style' | 'room' | 'tag', value: string) => void;
  className?: string;
  showHeader?: boolean;
}

export function SmartSuggestionsPanel({
  context,
  onApplySuggestion,
  className,
  showHeader = true,
}: SmartSuggestionsPanelProps) {
  const { generateSuggestions, loading, analytics } = useSmartSuggestions();
  const [suggestions, setSuggestions] = useState<CollectionSuggestion[]>([]);
  const [appliedSuggestions, setAppliedSuggestions] = useState<Set<string>>(
    new Set()
  );

  // Regenerate suggestions when context changes
  useEffect(() => {
    if (!loading && analytics) {
      const newSuggestions = generateSuggestions(context);
      setSuggestions(newSuggestions);
    }
  }, [context, loading, analytics, generateSuggestions]);

  const handleApplySuggestion = (suggestion: CollectionSuggestion) => {
    onApplySuggestion(suggestion.type as any, suggestion.value);
    setAppliedSuggestions(prev => new Set([...prev, suggestion.value]));
  };

  const getConfidenceColor = (confidence: number): string => {
    if (confidence >= 0.8) return 'text-green-600 bg-green-50 border-green-200';
    if (confidence >= 0.6) return 'text-blue-600 bg-blue-50 border-blue-200';
    return 'text-black bg-gray-50 border-gray-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.8) return <Target className="h-3 w-3" />;
    if (confidence >= 0.6) return <TrendingUp className="h-3 w-3" />;
    return <Lightbulb className="h-3 w-3" />;
  };

  const getSuggestionIcon = (type: string) => {
    switch (type) {
      case 'style':
        return '🎨';
      case 'room':
        return '🏠';
      case 'tag':
        return '🏷️';
      default:
        return '💡';
    }
  };

  const getSuggestionTypeLabel = (type: string) => {
    switch (type) {
      case 'style':
        return 'Style';
      case 'room':
        return 'Pièce';
      case 'tag':
        return 'Tag';
      default:
        return 'Suggestion';
    }
  };

  if (loading) {
    return (
      <div className={cn('bg-gray-50 rounded-lg p-4', className)}>
        <div className="flex items-center space-x-2 mb-3">
          <Brain className="h-4 w-4 text-gray-400 animate-pulse" />
          <span className="text-sm text-gray-500">Analyse en cours...</span>
        </div>
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-12 bg-gray-200 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (suggestions.length === 0) {
    return (
      <div className={cn('bg-gray-50 rounded-lg p-4', className)}>
        {showHeader && (
          <div className="flex items-center space-x-2 mb-3">
            <Sparkles className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium text-gray-600">
              Suggestions intelligentes
            </span>
          </div>
        )}
        <div className="text-center py-6">
          <Brain className="h-8 w-8 text-gray-300 mx-auto mb-2" />
          <p className="text-sm text-gray-500">
            Aucune suggestion disponible pour le moment
          </p>
          <p className="text-xs text-gray-400 mt-1">
            Remplissez plus d'informations pour obtenir des suggestions
            personnalisées
          </p>
        </div>
      </div>
    );
  }

  // Group suggestions by type
  const groupedSuggestions = suggestions.reduce(
    (acc, suggestion) => {
      if (!acc[suggestion.type]) {
        acc[suggestion.type] = [];
      }
      acc[suggestion.type].push(suggestion);
      return acc;
    },
    {} as Record<string, CollectionSuggestion[]>
  );

  return (
    <div
      className={cn(
        'bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg p-4 border border-blue-100',
        className
      )}
    >
      {showHeader && (
        <div className="flex items-center space-x-2 mb-4">
          <div className="flex items-center space-x-2">
            <div className="p-1 bg-gradient-to-r from-blue-500 to-purple-600 rounded">
              <Sparkles className="h-3 w-3 text-white" />
            </div>
            <span className="text-sm font-medium text-gray-800">
              Suggestions IA
            </span>
          </div>
          <Badge variant="secondary" className="text-xs bg-white text-gray-600">
            {suggestions.length} suggestion{suggestions.length > 1 ? 's' : ''}
          </Badge>
        </div>
      )}

      <div className="space-y-4">
        {Object.entries(groupedSuggestions).map(([type, typeSuggestions]) => (
          <div key={type}>
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">{getSuggestionIcon(type)}</span>
              <span className="text-xs font-medium text-gray-600 uppercase tracking-wide">
                {getSuggestionTypeLabel(type)}
              </span>
            </div>

            <div className="space-y-2">
              {typeSuggestions.slice(0, 3).map((suggestion, index) => {
                const isApplied = appliedSuggestions.has(suggestion.value);
                const isAlreadySelected =
                  (suggestion.type === 'style' &&
                    context.style === suggestion.value) ||
                  (suggestion.type === 'room' &&
                    context.room_category === suggestion.value) ||
                  (suggestion.type === 'tag' &&
                    context.existing_tags?.includes(suggestion.value));

                return (
                  <div
                    key={`${suggestion.type}-${suggestion.value}-${index}`}
                    className={cn(
                      'group relative bg-white rounded-lg border p-3 transition-all duration-200 hover:shadow-sm',
                      isAlreadySelected
                        ? 'border-green-300 bg-green-50'
                        : isApplied
                          ? 'border-gray-200 bg-gray-50 opacity-75'
                          : 'border-gray-200 hover:border-gray-300 cursor-pointer'
                    )}
                    onClick={
                      !isAlreadySelected && !isApplied
                        ? () => handleApplySuggestion(suggestion)
                        : undefined
                    }
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">
                            {suggestion.label}
                          </span>

                          {/* Confidence indicator */}
                          <div
                            className={cn(
                              'flex items-center space-x-1 px-2 py-0.5 rounded-full border text-xs',
                              getConfidenceColor(suggestion.confidence)
                            )}
                          >
                            {getConfidenceIcon(suggestion.confidence)}
                            <span>
                              {Math.round(suggestion.confidence * 100)}%
                            </span>
                          </div>

                          {isAlreadySelected && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-green-100 text-green-700"
                            >
                              Sélectionné
                            </Badge>
                          )}

                          {isApplied && !isAlreadySelected && (
                            <Badge
                              variant="secondary"
                              className="text-xs bg-gray-100 text-gray-600"
                            >
                              Appliqué
                            </Badge>
                          )}
                        </div>

                        <p className="text-xs text-gray-600 leading-relaxed">
                          {suggestion.reason}
                        </p>
                      </div>

                      {!isAlreadySelected && !isApplied && (
                        <ButtonV2
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8 p-0 ml-2"
                          onClick={e => {
                            e.stopPropagation();
                            handleApplySuggestion(suggestion);
                          }}
                        >
                          <ChevronRight className="h-3 w-3" />
                        </ButtonV2>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Analytics insight */}
      {analytics && (
        <div className="mt-4 pt-3 border-t border-blue-200">
          <div className="flex items-center space-x-2 text-xs text-gray-600">
            <Brain className="h-3 w-3" />
            <span>
              Basé sur l'analyse de{' '}
              {Object.values(analytics.style_popularity).reduce(
                (a, b) => a + b,
                0
              )}{' '}
              collections existantes
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
