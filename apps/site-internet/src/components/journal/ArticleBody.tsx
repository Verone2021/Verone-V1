import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { parseArticleBody } from '@/lib/parse-article-body';

import { ArticleProductEmbed } from './ArticleProductEmbed';

interface ArticleBodyProps {
  markdown: string;
}

export function ArticleBody({ markdown }: ArticleBodyProps) {
  const blocks = parseArticleBody(markdown);

  return (
    <div className="mx-auto max-w-2xl">
      {blocks.map((block, i) => {
        if (block.type === 'product') {
          return (
            <ArticleProductEmbed
              key={`product-${i}`}
              name={block.name}
              slug={block.slug}
              image={block.image}
              alt={block.alt}
            />
          );
        }

        return (
          <div key={`md-${i}`} className="article-prose">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h2: ({ children }) => (
                  <h2 className="font-bodoni mt-10 mb-4 text-2xl text-[#1d1d1b]">
                    {children}
                  </h2>
                ),
                h3: ({ children }) => (
                  <h3 className="font-bodoni mt-8 mb-3 text-xl text-[#1d1d1b]">
                    {children}
                  </h3>
                ),
                p: ({ children }) => (
                  <p className="font-montserrat mb-5 text-[17px] leading-[1.8] text-[#1d1d1b]">
                    {children}
                  </p>
                ),
                ul: ({ children }) => (
                  <ul className="font-montserrat mb-5 ml-6 list-disc space-y-2 text-[17px] leading-[1.8] text-[#1d1d1b]">
                    {children}
                  </ul>
                ),
                ol: ({ children }) => (
                  <ol className="font-montserrat mb-5 ml-6 list-decimal space-y-2 text-[17px] leading-[1.8] text-[#1d1d1b]">
                    {children}
                  </ol>
                ),
                li: ({ children }) => <li>{children}</li>,
                strong: ({ children }) => (
                  <strong className="font-semibold text-[#1d1d1b]">
                    {children}
                  </strong>
                ),
                em: ({ children }) => (
                  <em className="italic text-[#9B9B98]">{children}</em>
                ),
                a: ({ href, children }) => (
                  <a
                    href={href}
                    className="text-[#C9A961] underline underline-offset-2 hover:text-[#1d1d1b] transition-colors"
                    target={href?.startsWith('http') ? '_blank' : undefined}
                    rel={
                      href?.startsWith('http')
                        ? 'noopener noreferrer'
                        : undefined
                    }
                  >
                    {children}
                  </a>
                ),
                blockquote: ({ children }) => (
                  <blockquote className="my-6 border-l-2 border-[#C9A961] pl-6">
                    <div className="font-bodoni italic text-xl text-[#9B9B98]">
                      {children}
                    </div>
                  </blockquote>
                ),
                hr: () => <hr className="my-10 border-[#E6E5E2]" />,
                img: ({ src, alt }) => (
                  // eslint-disable-next-line @next/next/no-img-element -- markdown body images pas gérées par next/image (src dynamique non contrôlé)
                  <img
                    src={src}
                    alt={alt ?? ''}
                    className="my-6 w-full object-cover"
                    loading="lazy"
                  />
                ),
              }}
            >
              {block.content}
            </ReactMarkdown>
          </div>
        );
      })}
    </div>
  );
}
