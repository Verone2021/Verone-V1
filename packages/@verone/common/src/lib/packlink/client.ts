/**
 * Packlink PRO API Client
 * Documentation: https://support-pro.packlink.com/hc/en-gb
 * Base URL: https://apisandbox.packlink.com/v1 (test) or https://api.packlink.com/v1 (prod)
 */

// Always use production API (API key is production)
const PACKLINK_BASE_URL = 'https://api.packlink.com/v1';

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

export interface PacklinkAddress {
  country: string;
  zip_code: string;
  city: string;
  street1: string;
  phone: string;
  email: string;
  name: string;
  surname: string;
  company?: string;
}

interface PacklinkShipmentInput {
  from: PacklinkAddress;
  to: PacklinkAddress;
  packages: Array<{
    width: number;
    height: number;
    length: number;
    weight: number;
  }>;
  service_id: number;
  /** Service display name returned by GET /services (ex: "Standard"). Required by /v1/shipments. */
  service_name?: string;
  /** Carrier display name returned by GET /services (ex: "UPS"). Required by /v1/shipments. */
  carrier_name?: string;
  content: string;
  contentvalue: number;
  content_second_hand?: boolean;
  shipment_custom_reference?: string;
  source: string;
  dropoff_point_id?: string;
  collection_date?: string;
  collection_time?: string;
}

interface PacklinkShipmentResult {
  reference: string;
  tracking_url: string;
  label_url?: string;
  receipt_url?: string;
  total_price: number;
  currency: string;
}

interface PacklinkWarehouse {
  id: string;
  default_selection: boolean;
  name: string;
  postal_code: string;
  postal_code_id: string;
  city: string;
  country: string;
  postal_zone: { id: string };
}

interface PacklinkPostalCodeInfo {
  id: string;
  zipcode: string;
  city: string;
  postal_zone_id: number;
}

interface PacklinkTrackingEvent {
  city: string;
  timestamp: string;
  description: string;
}

export interface PacklinkDropoff {
  id: string;
  commerce_name: string;
  address: string;
  city: string;
  zip: string;
  country: string;
  phone?: string;
  lat: number;
  long: number;
  distance?: number;
  opening_times: Record<string, string>;
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
   * List warehouses configured on the Packlink account.
   * Endpoint: GET /warehouses
   *
   * Used internally by createShipment to resolve `selectedWarehouseId` and
   * `zip_code_id_from` for the `additional_data` payload required to land a
   * shipment in the "Prêts pour le paiement" inbox of Packlink PRO.
   */
  async listWarehouses(): Promise<PacklinkWarehouse[]> {
    return this.request<PacklinkWarehouse[]>('GET', '/warehouses');
  }

  /**
   * Resolve a destination zip_code into the internal Packlink ID.
   * Endpoint: GET /locations/postalcodes?language=fr_FR&postalzone={zone}&q={zip}&platform=PRO&platform_country=FR
   *
   * Returns the first matching entry (most relevant). The `id` field is the
   * UUID that must be passed in `additional_data.zip_code_id_to`.
   */
  async resolvePostalCode(params: {
    zip: string;
    postalZone: string;
    country?: string;
  }): Promise<PacklinkPostalCodeInfo | null> {
    const qs = new URLSearchParams({
      language: 'fr_FR',
      postalzone: params.postalZone,
      q: params.zip,
      platform: 'PRO',
      platform_country: params.country ?? 'FR',
    });
    const list = await this.request<PacklinkPostalCodeInfo[]>(
      'GET',
      `/locations/postalcodes?${qs.toString()}`
    );
    return list[0] ?? null;
  }

  /**
   * Create a shipment that lands in "Prêts pour le paiement" of Packlink PRO.
   *
   * IMPORTANT: A naive `POST /shipments` with only the basics produces a
   * shipment stuck in `AWAITING_COMPLETION` (invisible to the user, never
   * payable). The PRO web wizard does an enriched POST with `additional_data`
   * containing the warehouse + postal-zone + zip-code internal IDs and a
   * `parcelIds` field. We reproduce that payload below so the shipment
   * lands in `READY_TO_PURCHASE` and the user can pay it from the PRO web
   * interface.
   *
   * Reference: reverse-engineered on 2026-04-23 by inspecting the network
   * traffic of pro.packlink.fr (see scratchpad rapport).
   */
  async createShipment(
    input: PacklinkShipmentInput
  ): Promise<PacklinkShipmentResult> {
    // 1. Resolve sender warehouse (default selection if multiple).
    const warehouses = await this.listWarehouses();
    const warehouse =
      warehouses.find(w => w.default_selection) ?? warehouses[0];
    if (!warehouse) {
      throw new Error(
        'No warehouse configured on Packlink account. Configure one on Packlink PRO before shipping.'
      );
    }

    // 2. Resolve destination postal code into Packlink internal ID.
    const destInfo = await this.resolvePostalCode({
      zip: input.to.zip_code,
      postalZone: warehouse.postal_zone.id,
      country: input.to.country,
    });
    if (!destInfo) {
      throw new Error(
        `Packlink postal code resolver returned no match for ${input.to.country} ${input.to.zip_code}`
      );
    }

    // 3. Build the rich payload exactly as the PRO web wizard does.
    const richPayload = {
      carrier: input.carrier_name,
      service: input.service_name,
      service_id: input.service_id,
      adult_signature: false,
      additional_handling: false,
      insurance: { amount: 0, insurance_selected: false },
      print_in_store_selected: false,
      proof_of_delivery: false,
      priority: false,
      additional_data: {
        selectedWarehouseId: warehouse.id,
        postal_zone_id_from: warehouse.postal_zone.id,
        postal_zone_name_from: 'France',
        zip_code_id_from: warehouse.postal_code_id,
        postal_zone_id_to: String(destInfo.postal_zone_id),
        postal_zone_name_to: 'France',
        zip_code_id_to: destInfo.id,
        parcelIds: ['custom-parcel-id'],
      },
      content: input.content,
      contentvalue: input.contentvalue,
      currency: 'EUR',
      from: {
        ...input.from,
        state: 'France',
      },
      packages: input.packages.map(pkg => ({
        ...pkg,
        id: 'custom-parcel-id',
        name: 'CUSTOM_PARCEL',
      })),
      to: {
        ...input.to,
        state: 'France',
      },
      has_customs: false,
      shipment_custom_reference: input.shipment_custom_reference,
      ...(input.dropoff_point_id
        ? { dropoff_point_id: input.dropoff_point_id }
        : {}),
      ...(input.collection_date
        ? { collection_date: input.collection_date }
        : {}),
      ...(input.collection_time
        ? { collection_time: input.collection_time }
        : {}),
    };

    return this.request<PacklinkShipmentResult>(
      'POST',
      '/shipments',
      richPayload
    );
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

  /**
   * Create a draft shipment — no auto-insurance, no additional_data.
   * Endpoint: POST /v1/drafts
   *
   * The shipment lands in the "Brouillon" tab of Packlink PRO.
   * The user pays from the Packlink PRO web interface.
   * Unlike POST /v1/shipments, this endpoint does NOT apply any INSURANCE
   * line regardless of contentvalue.
   */
  async createDraft(input: {
    from: PacklinkAddress;
    to: PacklinkAddress;
    packages: Array<{
      weight: number;
      width: number;
      height: number;
      length: number;
    }>;
    service_id: number;
    content: string;
    contentvalue: number;
    shipment_custom_reference?: string;
    dropoff_point_id?: string;
    collection_date?: string;
    collection_time?: string;
  }): Promise<{ shipment_reference: string }> {
    return this.request<{ shipment_reference: string }>(
      'POST',
      '/drafts',
      input
    );
  }

  /**
   * Delete a draft shipment
   * Endpoint: DELETE /shipments/{reference}
   */
  async deleteShipment(reference: string): Promise<void> {
    await this.request<unknown>('DELETE', `/shipments/${reference}`);
  }

  /**
   * List all shipments (with optional status filter)
   * Endpoint: GET /shipments
   */
  async listShipments(params?: {
    status?: string;
    offset?: number;
    limit?: number;
  }): Promise<unknown[]> {
    const queryParams = new URLSearchParams();
    if (params?.status) queryParams.set('status', params.status);
    if (params?.offset !== undefined)
      queryParams.set('offset', String(params.offset));
    if (params?.limit !== undefined)
      queryParams.set('limit', String(params.limit));
    const qs = queryParams.toString();
    const result = await this.request<{ shipments: unknown[] } | unknown[]>(
      'GET',
      `/shipments${qs ? `?${qs}` : ''}`
    );
    // API returns { shipments: [...] }, unwrap it
    if (result && !Array.isArray(result) && 'shipments' in result) {
      return result.shipments;
    }
    return Array.isArray(result) ? result : [];
  }

  /**
   * Get dropoff/pickup points for a service
   * Endpoint: GET /dropoffs/{service_id}/{country}/{zip}
   */
  async getDropoffs(params: {
    serviceId: number;
    country: string;
    zip: string;
  }): Promise<PacklinkDropoff[]> {
    return this.request<PacklinkDropoff[]>(
      'GET',
      `/dropoffs/${params.serviceId}/${params.country}/${params.zip}`
    );
  }
}

// Singleton for server-side usage
let _client: PacklinkClient | null = null;

export function getPacklinkClient(): PacklinkClient {
  _client ??= new PacklinkClient();
  return _client;
}

// Source address for Verone
export const VERONE_SOURCE_ADDRESS: PacklinkAddress = {
  country: 'FR',
  zip_code: '91300',
  city: 'Massy',
  street1: '4 rue du Perou',
  phone: '+33600000000',
  email: 'contact@veronecollections.fr',
  name: 'Verone',
  surname: 'Collections',
  company: 'Verone',
};
