"use client";

import { XFetchError, XRequestInit } from "@edgeshiftlabs/xfetch";
import useSWR, { SWRResponse, SWRConfiguration } from "swr";
import { useXContext, XContext } from "./xcontext.js";
import { Disabled, Params } from "./helpers.js";
import { createFetcher } from "./fetcher.js";
import { StaticParams } from "./types.js";

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
     * Use this key in the swr key instead of the whole body
     */
    bodyKey?: any;
};

/**
 * @param urlLike The URL to fetch. Can be a path or a full URL. Use path variables like _/api/:id_.
 *
 * @template R Response type
 * @template P Path variables type
 * @template Q Query parameters type
 */
export function useXFetch<R = any, P extends Params = Params, Q extends Params = Params, B = any>(
    urlLike: string | Disabled,
    params: StaticParams<P, Q, B> | null,
    options?: UseXFetchOptions<R>
): UseXFetch<R> {
    const ctx = useXContext();

    const { fetcher, key } =
        urlLike && params && !options?.disabled
            ? createFetcher(
                  urlLike,
                  options?.ignoreContext ? {} : ctx.requestInit,
                  options?.ignoreContext ? {} : ctx.fetchesRequestInit,
                  options?.requestInit || {},
                  {
                      pathVariables: params.pathVariables,
                      queryParams: params.queryParams,
                      body: options?.bodyKey ?? params.body,
                  }
              )
            : {};

    const query = useSWR<R, XFetchError>(key, {
        fetcher,
        ...options?.swr,
    });

    return query;
}
