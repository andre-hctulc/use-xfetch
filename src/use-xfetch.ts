"use client";

import { XFetchError, XRequestInit } from "@edgeshiftlabs/xfetch";
import React from "react";
import useSWR, { SWRResponse, SWRConfiguration } from "swr";
import { useXContext, XContext } from "./xcontext.js";
import { Disabled, mergeRequestInit, Params, replacePathVariables } from "./helpers.js";
import { createFetcher, FetcherParams } from "./fetcher.js";

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
    onError?: (error: XFetchError) => void;
    onSuccess?: (data: R | undefined) => void;
    onResponse?: (data: R | undefined, error: XFetchError | null) => void;
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
export function useXFetch<R = any, P extends Params = Params, Q extends Params = Params>(
    urlLike: string | Disabled,
    params: UseXFetchParams<P, Q> | Disabled,
    options?: UseXFetchOptions<R>
): UseXFetch<R> {
    const ctx = useXContext();
    const started = React.useRef(false);
    const requestInit = mergeRequestInit(
        options?.ignoreContext ? {} : ctx.requestInit,
        options?.ignoreContext ? {} : ctx.fetchesRequestInit,
        options?.requestInit || {}
    );

    const parsedPath = React.useMemo<string | null>(() => {
        // control disabled by checking if params or urlLike is falsy
        if (!params || !urlLike || options?.disabled) return null;
        return params.pathVariables ? replacePathVariables(urlLike, params.pathVariables) : urlLike;
    }, [urlLike, params && params.pathVariables]);

    const key: null | FetcherParams =
        params && parsedPath
            ? {
                  path: parsedPath,
                  queryParams: params.queryParams,
                  body: options?.bodyKey ?? requestInit.body,
              }
            : null;

    const query = useSWR<R, XFetchError>(key, {
        fetcher: createFetcher<R>(requestInit),
        ...options?.swr,
    });

    React.useEffect(() => {
        if (query.isValidating) {
            started.current = true;
        }

        // check if started. isValidating can idle to false if the query mounts as disabled
        if (!query.isValidating && started.current) {
            options?.onSuccess?.(query.data);
            options?.onResponse?.(query.data, null);
        }
    }, [query.isValidating]);

    React.useEffect(() => {
        if (query.error) {
            options?.onError?.(query.error);
            options?.onResponse?.(undefined, query.error);
        }
    }, [query.error]);

    return query
}
