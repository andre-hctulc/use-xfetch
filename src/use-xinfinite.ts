"use client";

import { XFetchError, XRequestInit } from "@edgeshiftlabs/xfetch";
import { useXContext, XContext } from "./xcontext.js";
import { Disabled, Params } from "./helpers.js";
import useSWRInfinite, { SWRInfiniteConfiguration, SWRInfiniteResponse } from "swr/infinite";
import { createFetcher } from "./fetcher.js";
import { XCacheKey } from "./types.js";

export interface UseXInfiniteParams<R = any, P extends Params = Params, Q extends Params = Params> {
    /**
     * Undefined values will be ignored. All other values will be stringified.
     */
    queryParams?: Q | ((index: number, previousData: R | undefined) => Q);
    /**
     * Path variables to replace in the URL. The values are stringified.
     */
    pathVariables?: P | ((index: number, previousData: R | undefined) => P);
}

export type UseXInfinite<R = any> = SWRInfiniteResponse<R, XFetchError>;

export type UseXInfiniteOptions<R = any> = {
    requestInit?: XRequestInit;
    swr?: SWRInfiniteConfiguration<R, XFetchError>;
    disabled?: boolean;
    /**
     * Ignores the fetch options of the {@link XContext}
     */
    ignoreContext?: boolean;

    /**
     * Use this key in the swr key instead of the whole body
     */
    bodyKey?: (pageIndex: number) => any;
};

/**
 * @param urlLike The URL to fetch. Can be a path or a full URL. Use path variables like _/api/:id_.
 *
 * @template R Response type
 * @template P Path variables type
 * @template Q Query parameters type
 */
export function useXInfinite<R = any, P extends Params = Params, Q extends Params = Params>(
    urlLike: string | Disabled,
    params: UseXInfiniteParams<P, Q> | Disabled,
    options?: UseXInfiniteOptions<R>
): UseXInfinite<R> {
    const ctx = useXContext();

    const { fetcher, key } =
        params && urlLike
            ? createFetcher(
                  urlLike,
                  options?.ignoreContext ? {} : ctx.requestInit,
                  options?.ignoreContext ? {} : ctx.infinitesRequestInit,
                  options?.requestInit || {}
              )
            : {};
    const infinite = useSWRInfinite<R, XFetchError>(
        (index, previousData) => {
            if (!urlLike || key || !params) return null;

            const fetcherParams: XCacheKey = {
                urlLike,
                pathVariables:
                    typeof params.pathVariables === "function"
                        ? params.pathVariables(index, previousData)
                        : params.pathVariables,
                queryParams:
                    typeof params.queryParams === "function"
                        ? params.queryParams(index, previousData)
                        : params.queryParams,
                body: options?.bodyKey ? options.bodyKey(index) : options?.requestInit?.body,
                index,
                infinite: true,
            };

            return fetcherParams;
        },
        {
            fetcher,
            ...options?.swr,
        }
    );

    return infinite;
}
