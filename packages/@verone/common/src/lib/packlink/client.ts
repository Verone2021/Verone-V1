/**
 * Packlink PRO API Client
 * Documentation: https://support-pro.packlink.com/hc/en-gb
 * Base URL: https://apisandbox.packlink.com/v1 (test) or https://api.packlink.com/v1 (prod)
 */

const PACKLINK_BASE_URL =
  process.env.NODE_ENV === 'production'
    ? 'https://api.packlink.com/v1'
    : 'https://apisandbox.packlink.com/v1';

interface PacklinkServiceResult {
  id: number;
  carrier_name: string;
  service_name: string;
  price: {
    total_price: number;
    currency: string;
  };
  transit_hours: string;
  transit_time: string;
  delivery_to_parcelshop: boolean;
  first_estimated_delivery_date: string;
}

interface PacklinkShipmentInput {
  from: {
    country: string;
    zip: string;
    city: string;
    street1: string;
    phone: string;
    email: string;
    name: string;
    surname: string;
    company?: string;
  };
  to: {
    country: string;
    zip: string;
    city: string;
    street1: string;
    phone: string;
    email: string;
    name: string;
    surname: string;
  };
  packages: Array<{
    width: number;
    height: number;
    length: number;
    weight: number;
  }>;
  service_id: number;
  content: string;
  content_value: number;
  source: string;
}

interface PacklinkShipmentResult {
  reference: string;
  tracking_url: string;
  label_url?: string;
  receipt_url?: string;
  total_price: number;
  currency: string;
}

interface PacklinkTrackingEvent {
  city: string;
  timestamp: string;
  description: string;
}

export class PacklinkClient {
  private apiKey: string;

  constructor(apiKey?: string) {
    const key = apiKey ?? process.env.PACKLINK_API_KEY;
    if (!key) {
      throw new Error('PACKLINK_API_KEY is not configured');
    }
    this.apiKey = key;
  }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown
  ): Promise<T> {
    const url = `${PACKLINK_BASE_URL}${path}`;
    const response = await fetch(url, {
      method,
      headers: {
        Authorization: this.apiKey,
        'Content-Type': 'application/json',
      },
      ...(body ? { body: JSON.stringify(body) } : {}),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Packlink API error ${response.status}: ${errorText}`);
    }

    return response.json() as Promise<T>;
  }

  /**
   * Get available shipping services for a route
   * Endpoint: GET /services?from[country]=FR&from[zip]=91300&to[country]=FR&to[zip]=75002&packages[0][weight]=5&packages[0][width]=30&packages[0][height]=30&packages[0][length]=30
   */
  async getServices(params: {
    fromCountry: string;
    fromZip: string;
    toCountry: string;
    toZip: string;
    packages: Array<{
      weight: number;
      width: number;
      height: number;
      length: number;
    }>;
  }): Promise<PacklinkServiceResult[]> {
    const queryParams = new URLSearchParams();
    queryParams.set('from[country]', params.fromCountry);
    queryParams.set('from[zip]', params.fromZip);
    queryParams.set('to[country]', params.toCountry);
    queryParams.set('to[zip]', params.toZip);

    params.packages.forEach((pkg, i) => {
      queryParams.set(`packages[${i}][weight]`, String(pkg.weight));
      queryParams.set(`packages[${i}][width]`, String(pkg.width));
      queryParams.set(`packages[${i}][height]`, String(pkg.height));
      queryParams.set(`packages[${i}][length]`, String(pkg.length));
    });

    return this.request<PacklinkServiceResult[]>(
      'GET',
      `/services?${queryParams.toString()}`
    );
  }

  /**
   * Create a shipment order
   * Endpoint: POST /shipments
   */
  async createShipment(
    input: PacklinkShipmentInput
  ): Promise<PacklinkShipmentResult> {
    return this.request<PacklinkShipmentResult>('POST', '/shipments', input);
  }

  /**
   * Get shipment details
   * Endpoint: GET /shipments/{reference}
   */
  async getShipment(
    reference: string
  ): Promise<PacklinkShipmentResult & { status: string }> {
    return this.request<PacklinkShipmentResult & { status: string }>(
      'GET',
      `/shipments/${reference}`
    );
  }

  /**
   * Get tracking history for a shipment
   * Endpoint: GET /shipments/{reference}/tracking
   */
  async getTracking(reference: string): Promise<PacklinkTrackingEvent[]> {
    return this.request<PacklinkTrackingEvent[]>(
      'GET',
      `/shipments/${reference}/tracking`
    );
  }

  /**
   * Get shipping labels
   * Endpoint: GET /shipments/{reference}/labels
   */
  async getLabels(reference: string): Promise<string[]> {
    return this.request<string[]>('GET', `/shipments/${reference}/labels`);
  }

  /**
   * Register a webhook callback
   * Endpoint: POST /shipments/callback
   */
  async registerCallback(url: string): Promise<void> {
    await this.request<unknown>('POST', '/shipments/callback', { url });
  }
}

// Singleton for server-side usage
let _client: PacklinkClient | null = null;

export function getPacklinkClient(): PacklinkClient {
  _client ??= new PacklinkClient();
  return _client;
}

// Source address for Verone
export const VERONE_SOURCE_ADDRESS = {
  country: 'FR',
  zip: '91300',
  city: 'Massy',
  street1: '4 rue du Perou',
  phone: '+33600000000',
  email: 'contact@veronecollections.fr',
  name: 'Verone',
  surname: 'Collections',
  company: 'Verone',
} as const;
