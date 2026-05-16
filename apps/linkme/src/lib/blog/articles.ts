/**
 * Blog articles loader
 *
 * Lit les fichiers `.md` dans `src/content/blog/`, parse le frontmatter
 * via gray-matter, retourne les articles publiés (status: published).
 *
 * Server-only — utilise `fs` au build time. Toutes les pages blog sont
 * en SSG via `generateStaticParams`.
 *
 * @module BlogArticles
 * @since 2026-05-15 - LM-SEO-NAV-BLOG-001
 */

import 'server-only';

import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';

import matter from 'gray-matter';
import { remark } from 'remark';
import remarkHtml from 'remark-html';

const CONTENT_DIR = path.join(process.cwd(), 'src/content/blog');

export interface IArticleFrontmatter {
  title: string;
  description: string;
  slug: string;
  keyword_cible?: string;
  date: string;
  status: 'published' | 'draft';
}

export interface IArticleSummary extends IArticleFrontmatter {
  filename: string;
}

export interface IArticleFull extends IArticleSummary {
  contentHtml: string;
}

function readArticles(): IArticleSummary[] {
  let entries: string[] = [];
  try {
    entries = readdirSync(CONTENT_DIR);
  } catch {
    // Aucun dossier de contenu encore créé — pas d'erreur
    return [];
  }

  const articles: IArticleSummary[] = [];

  for (const filename of entries) {
    if (!filename.endsWith('.md') && !filename.endsWith('.mdx')) continue;

    const fullPath = path.join(CONTENT_DIR, filename);
    const raw = readFileSync(fullPath, 'utf8');
    const parsed = matter(raw);
    const data = parsed.data as Partial<IArticleFrontmatter>;

    if (
      typeof data.title !== 'string' ||
      typeof data.description !== 'string' ||
      typeof data.slug !== 'string' ||
      typeof data.date !== 'string' ||
      (data.status !== 'published' && data.status !== 'draft')
    ) {
      // Frontmatter invalide → ignoré (pas de crash build)
      continue;
    }

    articles.push({
      filename,
      title: data.title,
      description: data.description,
      slug: data.slug,
      keyword_cible: data.keyword_cible,
      date: data.date,
      status: data.status,
    });
  }

  return articles;
}

export function getPublishedArticles(): IArticleSummary[] {
  return readArticles()
    .filter(a => a.status === 'published')
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getAllArticleSlugs(): string[] {
  return getPublishedArticles().map(a => a.slug);
}

export async function getArticleBySlug(
  slug: string
): Promise<IArticleFull | null> {
  const articles = readArticles().filter(a => a.status === 'published');
  const article = articles.find(a => a.slug === slug);
  if (!article) return null;

  const fullPath = path.join(CONTENT_DIR, article.filename);
  const raw = readFileSync(fullPath, 'utf8');
  const parsed = matter(raw);

  const processed = await remark()
    .use(remarkHtml, { sanitize: false })
    .process(parsed.content);

  return {
    ...article,
    contentHtml: processed.toString(),
  };
}
