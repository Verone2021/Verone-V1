/**
 * Parse le markdown d'un article en blocs alternés texte / produit.
 * Les blocs produit sont définis par des commentaires HTML :
 *
 * <!-- PRODUIT
 * name: "Nom produit"
 * slug: "slug-produit"
 * image: "https://..."
 * alt: "Description alt"
 * -->
 */

export interface MarkdownBlock {
  type: 'markdown';
  content: string;
}

export interface ProductBlock {
  type: 'product';
  name: string;
  slug: string;
  image: string;
  alt: string;
}

export type ArticleBlock = MarkdownBlock | ProductBlock;

const PRODUCT_COMMENT_RE = /<!--\s*PRODUIT\s*\n([^]*?)-->/g;

function parseProductComment(inner: string): Omit<ProductBlock, 'type'> | null {
  const nameMatch = /name:\s*["']([^"']+)["']/.exec(inner);
  const slugMatch = /slug:\s*["']([^"']+)["']/.exec(inner);
  const imageMatch = /image:\s*["']([^"']+)["']/.exec(inner);
  const altMatch = /alt:\s*["']([^"']+)["']/.exec(inner);

  if (!nameMatch || !slugMatch || !imageMatch || !altMatch) return null;

  return {
    name: nameMatch[1],
    slug: slugMatch[1],
    image: imageMatch[1],
    alt: altMatch[1],
  };
}

export function parseArticleBody(markdown: string): ArticleBlock[] {
  const blocks: ArticleBlock[] = [];
  let lastIndex = 0;

  // Réinitialiser l'état du regex global
  PRODUCT_COMMENT_RE.lastIndex = 0;

  for (const match of markdown.matchAll(PRODUCT_COMMENT_RE)) {
    const matchStart = match.index ?? 0;
    const matchEnd = matchStart + match[0].length;

    // Texte avant ce bloc produit
    const textBefore = markdown.slice(lastIndex, matchStart).trim();
    if (textBefore) {
      blocks.push({ type: 'markdown', content: textBefore });
    }

    // Bloc produit
    const productData = parseProductComment(match[1]);
    if (productData) {
      blocks.push({ type: 'product', ...productData });
    }

    lastIndex = matchEnd;
  }

  // Texte restant après le dernier bloc produit
  const remaining = markdown.slice(lastIndex).trim();
  if (remaining) {
    blocks.push({ type: 'markdown', content: remaining });
  }

  // Si aucun bloc produit trouvé, retourner le markdown entier
  if (blocks.length === 0) {
    blocks.push({ type: 'markdown', content: markdown });
  }

  return blocks;
}
