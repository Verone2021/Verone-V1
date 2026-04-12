/**
 * CmsPageContent - Renders a CMS page from the database
 *
 * Fetches content by slug from cms_pages table.
 * Renders Markdown content as HTML with Verone styling.
 */

import { notFound } from 'next/navigation';

import { createClient } from '@supabase/supabase-js';

interface CmsPage {
  title: string;
  content: string;
  meta_title: string | null;
  meta_description: string | null;
}

async function getCmsPage(slug: string): Promise<CmsPage | null> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseKey) return null;

  const supabase = createClient(supabaseUrl, supabaseKey);
  const { data } = await supabase
    .from('cms_pages')
    .select('title, content, meta_title, meta_description')
    .eq('slug', slug)
    .eq('is_published', true)
    .single();

  return data as CmsPage | null;
}

/**
 * Simple Markdown to HTML converter for CMS content.
 * Handles: ## headings, **bold**, lists (- and 1.), paragraphs, links.
 */
function markdownToHtml(md: string): string {
  return md
    .split('\n\n')
    .map(block => {
      const trimmed = block.trim();
      if (!trimmed) return '';

      // H2 heading
      if (trimmed.startsWith('## ')) {
        return `<h2 class="text-lg font-semibold text-verone-black mb-3 mt-8">${trimmed.slice(3)}</h2>`;
      }

      // Unordered list
      if (trimmed.split('\n').every(l => l.trim().startsWith('- '))) {
        const items = trimmed
          .split('\n')
          .map(l => `<li>${formatInline(l.trim().slice(2))}</li>`)
          .join('');
        return `<ul class="list-disc pl-5 space-y-1">${items}</ul>`;
      }

      // Ordered list
      if (trimmed.split('\n').every(l => /^\d+\.\s/.test(l.trim()))) {
        const items = trimmed
          .split('\n')
          .map(
            l => `<li>${formatInline(l.trim().replace(/^\d+\.\s/, ''))}</li>`
          )
          .join('');
        return `<ol class="list-decimal pl-5 space-y-1">${items}</ol>`;
      }

      // Paragraph
      return `<p>${formatInline(trimmed.replace(/\n/g, '<br/>'))}</p>`;
    })
    .filter(Boolean)
    .join('\n');
}

function formatInline(text: string): string {
  return text.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
}

export async function CmsPageContent({ slug }: { slug: string }) {
  const page = await getCmsPage(slug);

  if (!page) {
    notFound();
  }

  const html = markdownToHtml(page.content);

  return (
    <div className="max-w-4xl mx-auto px-6 lg:px-8 py-16">
      <h1 className="font-playfair text-4xl font-bold text-verone-black mb-12">
        {page.title}
      </h1>
      <div
        className="space-y-4 text-sm text-verone-gray-600 leading-relaxed prose-headings:mt-8"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  );
}

export { getCmsPage };
