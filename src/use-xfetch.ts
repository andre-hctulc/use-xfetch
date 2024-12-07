"use client";

import { XFetchError, XRequestInit } from "@andre-hctulc/xfetch";
import React from "react";
import useSWR, { SWRResponse, SWRConfiguration } from "swr";
import { useXContext } from "./xcontext.js";
import { Disabled, Params, replacePathVariables } from "./helpers.js";
import { createFetcher, FetcherParams } from "./fetcher.js";

export interface UseXFetchParams<Q extends Params = Params, P extends Params = Params> {
    /**
     * Undefined values will be ignored. All other values will be stringified.
     */
    queryParams?: Q;
    /**
     * Path variables to replace in the URL. The values are stringified.
     */
    pathVariables?: P;
}

export type UseXFetchResult<R = any> = SWRResponse<R, XFetchError>;

export type UseXFetchOptions<R = any> = {
    requestInit?: XRequestInit;
    swr?: SWRConfiguration<R, XFetchError>;
    onError?: (error: XFetchError) => void;
    onSuccess?: (data: R | undefined) => void;
    disabled?: boolean;
};

/**
 * @param urlLike The URL to fetch. Can be a path or a full URL. Use path variables like _/api/:id_.
 *
 * @template R Response type
 * @template Q Query parameters type
 * @template P Path variables type
 */
export function useXFetch<R = any, Q extends Params = Params, P extends Params = Params>(
    urlLike: string | Disabled,
    params?: UseXFetchParams<Q, P> | Disabled,
    options?: UseXFetchOptions<R>
): UseXFetchResult<R> {
    const ctx = useXContext();
    const started = React.useRef(false);

    const parsedPath = React.useMemo<string | null>(() => {
        // control disabled by checking if params or urlLike is falsy
        if (!params || !urlLike || options?.disabled) return null;
        return params.pathVariables ? replacePathVariables(urlLike, params.pathVariables) : urlLike;
    }, [urlLike, params && params.pathVariables]);

    const key: null | FetcherParams =
        params && parsedPath ? { path: parsedPath, queryParams: params.queryParams } : null;

    const query = useSWR<R, XFetchError>(key, {
        fetcher: createFetcher<R>(ctx.requestInit, ctx.fetchesRequestInit, options?.requestInit || {}),
        ...options?.swr,
    });

    React.useEffect(() => {
        if (query.isValidating) {
            started.current = true;
        }

        // check if started. isValidating can idle to false if the query mounts as disabled
        if (!query.isValidating && started.current && options?.onSuccess) {
            options.onSuccess(query.data);
        }
    }, [query.isValidating]);

    React.useEffect(() => {
        if (query.error && options?.onError) {
            options.onError(query.error);
        }
    }, [query.error]);

    return query;
}
