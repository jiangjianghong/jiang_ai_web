/**
 * Configuration for a CORS proxy service
 */
export interface ProxyConfig {
  /** Name of the proxy service */
  name: string;

  /** Base URL of the proxy service */
  url: string;

  /** Function to transform the target URL for this proxy service */
  transformRequest?: (url: string) => string;

  /** Additional headers to send with requests through this proxy */
  headers?: Record<string, string>;

  /** Whether this proxy supports binary data (images, etc.) */
  supportsBinary?: boolean;

  /** Priority of this proxy (lower number = higher priority) */
  priority: number;

  /** Whether this is a Supabase Edge Function proxy */
  isSupabaseProxy?: boolean;
}

/**
 * Response from a proxy request
 */
export interface ProxyResponse<T> {
  /** The response data */
  data: T | null;

  /** Any error that occurred */
  error: Error | null;

  /** The proxy service that was used */
  source: string;
}
