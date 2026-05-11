'use client';

import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface ArticleMarkdownPreviewProps {
  markdown: string;
}

const PRODUCT_PLACEHOLDER_RE = /<!--\s*PRODUIT[\s\S]*?-->/g;

function prepareMarkdown(raw: string): string {
  // Remplacer les blocs <!-- PRODUIT --> par un placeholder lisible
  return raw.replace(PRODUCT_PLACEHOLDER_RE, match => {
    const nameMatch = /name:\s*["']([^"']+)["']/.exec(match);
    const name = nameMatch ? nameMatch[1] : 'Produit';
    return `\n> 📦 **Produit intégré : ${name}**\n`;
  });
}

export function ArticleMarkdownPreview({
  markdown,
}: ArticleMarkdownPreviewProps) {
  const prepared = prepareMarkdown(markdown);

  if (!prepared.trim()) {
    return (
      <div className="border border-dashed border-gray-200 px-4 py-12 text-center">
        <p className="text-sm text-gray-400 italic">
          L'aperçu apparaît ici au fil de ta saisie.
        </p>
      </div>
    );
  }

  return (
    <div className="max-h-[70vh] overflow-y-auto border border-gray-200 bg-white px-6 py-6">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="mb-4 mt-6 font-serif text-2xl font-bold text-gray-900">
              {children}
            </h1>
          ),
          h2: ({ children }) => (
            <h2 className="mb-3 mt-5 font-serif text-xl font-semibold text-gray-800">
              {children}
            </h2>
          ),
          h3: ({ children }) => (
            <h3 className="mb-2 mt-4 font-serif text-lg font-medium text-gray-700">
              {children}
            </h3>
          ),
          p: ({ children }) => (
            <p className="mb-4 text-sm leading-relaxed text-gray-700">
              {children}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="mb-4 ml-4 list-disc space-y-1 text-sm text-gray-700">
              {children}
            </ul>
          ),
          ol: ({ children }) => (
            <ol className="mb-4 ml-4 list-decimal space-y-1 text-sm text-gray-700">
              {children}
            </ol>
          ),
          li: ({ children }) => <li className="text-sm">{children}</li>,
          blockquote: ({ children }) => (
            <blockquote className="my-4 border-l-4 border-amber-400 bg-amber-50 px-4 py-2 text-sm italic text-gray-600">
              {children}
            </blockquote>
          ),
          strong: ({ children }) => (
            <strong className="font-semibold">{children}</strong>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              className="text-amber-700 underline"
              target="_blank"
              rel="noopener noreferrer"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="my-6 border-gray-200" />,
        }}
      >
        {prepared}
      </ReactMarkdown>
    </div>
  );
}
