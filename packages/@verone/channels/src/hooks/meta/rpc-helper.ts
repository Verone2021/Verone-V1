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
 * Avoids eslint-disable by casting once here.
 */
export async function callRpc<T>(
  fnName: string,
  params?: Record<string, unknown>
): Promise<RpcResult<T>> {
  const supabase = createClient();
  const rpcFn = supabase.rpc as (
    fn: string,
    params?: Record<string, unknown>
  ) => Promise<{ data: T | null; error: RpcError | null }>;
  return rpcFn(fnName, params);
}
