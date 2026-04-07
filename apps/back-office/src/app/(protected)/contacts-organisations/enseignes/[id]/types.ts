// Types locaux pour la page détail enseigne

export interface EnseigneProduct {
  id: string;
  name: string;
  sku: string | null;
  product_status: string;
  created_at: string | null;
  primary_image_url?: string | null;
}

export interface EnseigneChannel {
  code: 'linkme' | 'site-internet' | 'b2b';
  name: string;
  link: string;
  isActive: boolean;
}
