"use client";

import { XFetchError, type XRequestInit } from "@dre44/xfetch";
import useSWR, { type SWRResponse, type SWRConfiguration } from "swr";
import { useXContext, type XContext } from "./xcontext.js";
import { createFetcher } from "./fetcher.js";
import type { Disabled, FetcherArgs, Params } from "./types.js";

export interface UseXFetchParams<P extends Params = Params, Q extends Params = Params> {
    /**
     * Undefined values will be ignored. All other values will be stringified.
     */
    queryParams?: Q;
    /**
     * Path variables to replace in the URL. The values are stringified.
     */
    pathVariables?: P;
}

export type UseXFetch<R = any> = SWRResponse<R, XFetchError>;

export type UseXFetchOptions<R = any> = {
    requestInit?: XRequestInit;
    swr?: SWRConfiguration<R, XFetchError>;
    disabled?: boolean;
    /**
     * Ignores the fetch options of the {@link XContext}
     */
    ignoreContext?: boolean;
    /**
     * Adds a custom part to the SWR key, to further distinguish the request.
     */
    customKeyPart?: any;
    method?: string;
};

/**
 * @param urlLike The URL to fetch. Can be a path or a full URL. Use path variables like _/api/:id_.
 *
 * @template R Response type
 * @template P Path variables type
 * @template Q Query parameters type
 * @template B Body type
 */
export function useXFetch<R = any, P extends Params = Params, Q extends Params = Params, B = any>(
    urlLike: string | Disabled,
    params: FetcherArgs<P, Q, B> | Disabled,
    options?: UseXFetchOptions<R>,
): UseXFetch<R> {
    const ctx = useXContext();

    const { fetcher, key } =
        urlLike && params && !options?.disabled
            ? createFetcher(
                  urlLike,
                  options?.customKeyPart,
                  options?.ignoreContext ? {} : ctx.requestInit,
                  options?.ignoreContext ? {} : ctx.fetchesRequestInit,
                  options?.requestInit || {},
                  // Set method
                  { method: options?.method ?? options?.requestInit?.method ?? "GET" },
                  {
                      // paths vars and query is merged with other objects
                      pathVariables: params.pathVariables,
                      queryParams: params.queryParams,
                      body: params.body ?? options?.requestInit?.body,
                  },
              )
            : {};

    const query = useSWR<R, XFetchError>(key, {
        fetcher,
        ...options?.swr,
    });

    return query;
}
