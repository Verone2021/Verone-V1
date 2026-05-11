'use client';

import { useMemo, useState } from 'react';

import { ChevronDown, ChevronUp } from 'lucide-react';

interface ScoringCriteria {
  label: string;
  points: number;
  earned: number;
  advice: string;
}

interface ArticleSeoScoringProps {
  title: string;
  metaTitle: string;
  metaDescription: string;
  excerpt: string;
  bodyMarkdown: string;
  slug: string;
  focusKeyword: string;
}

function countWords(text: string): number {
  return text
    .replace(/```[\s\S]*?```/g, '') // strip code blocks
    .replace(/[#*_~`[\]()]/g, '')
    .trim()
    .split(/\s+/)
    .filter(w => w.length > 0).length;
}

function keywordDensity(body: string, keyword: string): number {
  if (!keyword) return 0;
  const words = countWords(body);
  if (words === 0) return 0;
  const kw = keyword.toLowerCase();
  const text = body.toLowerCase();
  const occurrences = (
    text.match(new RegExp(kw.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g')) ?? []
  ).length;
  return (occurrences / words) * 100;
}

export function ArticleSeoScoring({
  title,
  metaTitle,
  metaDescription,
  excerpt,
  bodyMarkdown,
  slug,
  focusKeyword,
}: ArticleSeoScoringProps) {
  const [expanded, setExpanded] = useState(false);

  const criteria = useMemo((): ScoringCriteria[] => {
    const kw = focusKeyword.toLowerCase().trim();
    const titleL = title.toLowerCase();
    const metaTitleL = metaTitle.toLowerCase();
    const metaDescL = metaDescription.toLowerCase();
    const excerptL = excerpt.toLowerCase();
    const bodyL = bodyMarkdown.toLowerCase();
    const first300 = bodyL.slice(0, 300);
    const slugL = slug.toLowerCase();

    // Comptages
    const wordCount = countWords(bodyMarkdown);
    const h2Count = (bodyMarkdown.match(/^## .+$/gm) ?? []).length;
    const internalLinks = (
      bodyMarkdown.match(/\(\/journal\/|\/produit\//g) ?? []
    ).length;
    const externalLinks = (bodyMarkdown.match(/\(https?:\/\//g) ?? []).length;
    const density = kw ? keywordDensity(bodyMarkdown, kw) : 0;

    // Vérification images avec alt
    const imgMatches = bodyMarkdown.match(/!\[([^\]]*)\]\([^)]+\)/g) ?? [];
    const imgsWithAlt = imgMatches.filter(m => !/!\[\s*\]/.test(m)).length;
    const allImgsHaveAlt =
      imgMatches.length === 0 || imgsWithAlt === imgMatches.length;

    return [
      {
        label: 'Mot-clé dans le titre',
        points: 15,
        earned: kw && titleL.includes(kw) ? 15 : 0,
        advice: kw
          ? 'Ajoute le mot-clé dans le titre'
          : 'Saisis un mot-clé cible',
      },
      {
        label: 'Mot-clé dans le meta_title',
        points: 5,
        earned: kw && metaTitleL.includes(kw) ? 5 : 0,
        advice: 'Ajoute le mot-clé dans le titre SEO',
      },
      {
        label: 'Mot-clé dans la meta_description',
        points: 5,
        earned: kw && metaDescL.includes(kw) ? 5 : 0,
        advice: 'Ajoute le mot-clé dans la description SEO',
      },
      {
        label: "Mot-clé dans l'extrait",
        points: 5,
        earned: kw && excerptL.includes(kw) ? 5 : 0,
        advice: "Ajoute le mot-clé dans l'extrait",
      },
      {
        label: 'Mot-clé dans le premier paragraphe',
        points: 10,
        earned: kw && first300.includes(kw) ? 10 : 0,
        advice: 'Place le mot-clé dans les 300 premiers caractères',
      },
      {
        label: `Densité mot-clé 0,5–2 % (actuelle : ${density.toFixed(1)} %)`,
        points: 10,
        earned: kw && density >= 0.5 && density <= 2 ? 10 : 0,
        advice:
          density > 2
            ? `Densité trop élevée — actuellement ${density.toFixed(1)} %`
            : 'Densité trop faible — utilise davantage le mot-clé',
      },
      {
        label: 'Mot-clé dans le slug',
        points: 5,
        earned: kw && slugL.includes(kw.replace(/\s+/g, '-')) ? 5 : 0,
        advice: 'Ajoute le mot-clé dans le slug',
      },
      {
        label: `Corps ≥ 600 mots (actuel : ${wordCount} mots)`,
        points: 10,
        earned: wordCount >= 600 ? 10 : 0,
        advice: `Ajoute ${600 - wordCount} mots minimum`,
      },
      {
        label: `Au moins 2 titres H2 (actuel : ${h2Count})`,
        points: 5,
        earned: h2Count >= 2 ? 5 : 0,
        advice: "Ajoute des titres H2 (## Titre) pour structurer l'article",
      },
      {
        label: `Au moins 1 lien interne (actuel : ${internalLinks})`,
        points: 5,
        earned: internalLinks >= 1 ? 5 : 0,
        advice: 'Ajoute un lien vers un article ou produit Vérone',
      },
      {
        label: `Au moins 1 lien externe (actuel : ${externalLinks})`,
        points: 5,
        earned: externalLinks >= 1 ? 5 : 0,
        advice: 'Ajoute un lien vers une source externe de qualité',
      },
      {
        label: '100 % des images ont un alt',
        points: 10,
        earned: allImgsHaveAlt ? 10 : 0,
        advice: 'Toutes les images doivent avoir un texte alternatif non vide',
      },
      {
        label: `Meta description 120–160 chars (actuel : ${metaDescription.length})`,
        points: 5,
        earned:
          metaDescription.length >= 120 && metaDescription.length <= 160
            ? 5
            : 0,
        advice:
          metaDescription.length < 120
            ? `Allonge la meta description de ${120 - metaDescription.length} chars`
            : `Raccourcis la meta description de ${metaDescription.length - 160} chars`,
      },
      {
        label: `Slug ≤ 60 chars (actuel : ${slug.length})`,
        points: 5,
        earned: slug.length > 0 && slug.length <= 60 ? 5 : 0,
        advice: 'Raccourcis le slug à 60 caractères maximum',
      },
    ];
  }, [
    title,
    metaTitle,
    metaDescription,
    excerpt,
    bodyMarkdown,
    slug,
    focusKeyword,
  ]);

  const totalPoints = criteria.reduce((acc, c) => acc + c.points, 0);
  const earnedPoints = criteria.reduce((acc, c) => acc + c.earned, 0);
  const score = Math.round((earnedPoints / totalPoints) * 100);

  const scoreColor =
    score >= 80 ? 'bg-green-500' : score >= 50 ? 'bg-orange-400' : 'bg-red-500';

  const scoreTextColor =
    score >= 80
      ? 'text-green-700'
      : score >= 50
        ? 'text-orange-600'
        : 'text-red-600';

  return (
    <div className="border border-gray-200 bg-white p-4">
      <div className="mb-3 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-gray-700">Score SEO</h3>
        <span className={`text-2xl font-bold ${scoreTextColor}`}>
          {score}/100
        </span>
      </div>

      {/* Barre */}
      <div className="mb-4 h-2 overflow-hidden bg-gray-100">
        <div
          className={`h-full transition-all duration-300 ${scoreColor}`}
          style={{ width: `${score}%` }}
        />
      </div>

      {/* Résumé */}
      <p className="mb-3 text-xs text-gray-500">
        {earnedPoints}/{totalPoints} points ·{' '}
        {criteria.filter(c => c.earned === 0).length} critère(s) à améliorer
      </p>

      {/* Toggle checklist */}
      <button
        onClick={() => setExpanded(e => !e)}
        className="flex w-full items-center justify-between text-xs text-gray-500 hover:text-gray-700 transition-colors"
      >
        <span>{expanded ? 'Masquer les détails' : 'Voir les 14 critères'}</span>
        {expanded ? (
          <ChevronUp className="h-3.5 w-3.5" />
        ) : (
          <ChevronDown className="h-3.5 w-3.5" />
        )}
      </button>

      {expanded && (
        <ul className="mt-3 space-y-2">
          {criteria.map((c, i) => (
            <li key={i} className="flex items-start gap-2 text-xs">
              <span className="mt-0.5 shrink-0 text-base leading-none">
                {c.earned === c.points ? '✅' : c.earned > 0 ? '⚠️' : '❌'}
              </span>
              <div>
                <p
                  className={
                    c.earned === c.points ? 'text-gray-700' : 'text-gray-500'
                  }
                >
                  {c.label}
                </p>
                {c.earned < c.points && (
                  <p className="text-gray-400 italic">{c.advice}</p>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
