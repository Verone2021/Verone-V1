import { createClient } from '@verone/utils/supabase/client';

interface RpcError {
  message: string;
}

interface RpcResult<T> {
  data: T | null;
  error: RpcError | null;
}

/**
 * Typed helper for calling Supabase RPCs not yet in generated types.
 */
export async function callRpc<T>(
  fnName: string,
  params?: Record<string, unknown>
): Promise<RpcResult<T>> {
  const supabase = createClient();
  // Build the RPC call and resolve the PostgrestFilterBuilder
  const builder = supabase.rpc(fnName as never, params as never);
  const { data, error } = await builder;
  return {
    data: data as T | null,
    error: error ? { message: error.message } : null,
  };
}
