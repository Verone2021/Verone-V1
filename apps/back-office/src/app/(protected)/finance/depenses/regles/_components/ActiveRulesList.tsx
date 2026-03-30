'use client';

import { useState } from 'react';

import { getPcgCategory } from '@verone/finance';
import { type MatchingRule } from '@verone/finance/hooks';
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
  Input,
  Tabs,
  TabsList,
  TabsTrigger,
} from '@verone/ui';
import {
  AlertCircle,
  Building2,
  Check,
  Loader2,
  Search,
  Settings,
  Trash2,
} from 'lucide-react';

interface ActiveRulesListProps {
  rules: MatchingRule[];
  isLoading: boolean;
  onEdit: (rule: MatchingRule) => void;
  onDelete: (ruleId: string) => void;
}

export function ActiveRulesList({
  rules,
  isLoading,
  onEdit,
  onDelete,
}: ActiveRulesListProps) {
  const [rulesSearch, setRulesSearch] = useState('');
  const [rulesTab, setRulesTab] = useState<'complete' | 'incomplete'>(
    'incomplete'
  );

  const searchFilteredRules = rules.filter(
    rule =>
      rule.match_value.toLowerCase().includes(rulesSearch.toLowerCase()) ||
      rule.organisation_name?.toLowerCase().includes(rulesSearch.toLowerCase())
  );

  const completeRules = searchFilteredRules.filter(
    rule => rule.default_category && rule.matched_expenses_count > 0
  );
  const incompleteRules = searchFilteredRules.filter(
    rule => !rule.default_category || rule.matched_expenses_count === 0
  );

  const filteredRules =
    rulesTab === 'complete' ? completeRules : incompleteRules;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Settings size={20} />
          Règles actives
          <Badge variant="secondary">{rules.length}</Badge>
        </CardTitle>
        <CardDescription>
          Règles qui classifient automatiquement les dépenses
        </CardDescription>
        {rules.length > 0 && (
          <>
            <Tabs
              value={rulesTab}
              onValueChange={v => setRulesTab(v as 'complete' | 'incomplete')}
              className="mt-3"
            >
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="incomplete" className="text-sm">
                  À compléter
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-amber-100 text-amber-700"
                  >
                    {incompleteRules.length}
                  </Badge>
                </TabsTrigger>
                <TabsTrigger value="complete" className="text-sm">
                  Complètes
                  <Badge
                    variant="secondary"
                    className="ml-2 bg-green-100 text-green-700"
                  >
                    {completeRules.length}
                  </Badge>
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="relative mt-2">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <Input
                placeholder="Rechercher une règle..."
                value={rulesSearch}
                onChange={e => setRulesSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </>
        )}
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="py-8 text-center">
            <Loader2 className="mx-auto h-8 w-8 animate-spin text-slate-400" />
            <p className="mt-2 text-slate-500">Chargement...</p>
          </div>
        ) : rules.length === 0 ? (
          <div className="py-8 text-center">
            <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
            <p className="mt-2 text-slate-600">Aucune règle créée</p>
            <p className="text-sm text-slate-500">
              Liez des libellés à des organisations depuis la colonne de gauche
            </p>
          </div>
        ) : filteredRules.length === 0 ? (
          <div className="py-8 text-center">
            {rulesSearch ? (
              <>
                <Search className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-slate-600">
                  Aucune règle trouvée pour "{rulesSearch}"
                </p>
              </>
            ) : rulesTab === 'incomplete' ? (
              <>
                <Check className="mx-auto h-12 w-12 text-green-500" />
                <p className="mt-2 text-slate-600">
                  Toutes les règles sont complètes !
                </p>
              </>
            ) : (
              <>
                <AlertCircle className="mx-auto h-12 w-12 text-slate-300" />
                <p className="mt-2 text-slate-600">Aucune règle complète</p>
                <p className="text-sm text-slate-500">
                  Complétez les règles dans l'onglet "À compléter"
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="max-h-[600px] space-y-3 overflow-y-auto">
            {filteredRules.map(rule => {
              const pcgCategory = getPcgCategory(rule.default_category ?? '');
              const missingCategory = !rule.default_category;
              const noMatches = rule.matched_expenses_count === 0;
              return (
                <div
                  key={rule.id}
                  className="cursor-pointer rounded-lg border border-slate-200 bg-white p-3 transition-all hover:border-blue-300 hover:shadow-md"
                  onClick={() => onEdit(rule)}
                >
                  <div className="flex items-start justify-between">
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-medium text-slate-900">
                        {rule.match_value}
                      </p>
                      <div className="mt-1 flex items-center gap-2">
                        <Building2 size={14} className="text-slate-400" />
                        <span className="truncate text-sm text-slate-600">
                          {rule.organisation_name ?? 'Non assigné'}
                        </span>
                      </div>
                      <div className="mt-1 flex flex-wrap items-center gap-2">
                        <Badge
                          variant="outline"
                          className={`text-xs ${missingCategory ? 'border-amber-300 bg-amber-50 text-amber-700' : ''}`}
                        >
                          {missingCategory
                            ? '⚠️ Catégorie manquante'
                            : (pcgCategory?.label ?? rule.default_category)}
                        </Badge>
                        <Badge
                          variant="default"
                          className={`text-xs ${noMatches ? 'bg-amber-100 text-amber-700' : ''}`}
                        >
                          {noMatches
                            ? '⚠️ 0 classée'
                            : `${rule.matched_expenses_count} classée(s)`}
                        </Badge>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={e => {
                        e.stopPropagation();
                        onDelete(rule.id);
                      }}
                      className="text-red-500 hover:text-red-700"
                    >
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
