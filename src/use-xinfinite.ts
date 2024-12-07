"use client";

import { XFetchError, XRequestInit } from "@andre-hctulc/xfetch";
import React from "react";
import { useXContext } from "./xcontext.js";
import { Disabled, Params, replacePathVariables } from "./helpers.js";
import useSWRInfinite, { SWRInfiniteConfiguration, SWRInfiniteResponse } from "swr/infinite";
import { createFetcher, FetcherParams } from "./fetcher.js";

export interface UseXInfiniteParams<R = any, Q extends Params = Params, P extends Params = Params> {
    /**
     * Undefined values will be ignored. All other values will be stringified.
     */
    queryParams?: Q | ((index: number, previousData: R | undefined) => Q);
    /**
     * Path variables to replace in the URL. The values are stringified.
     */
    pathVariables?: P;
}

export type UseXInfiniteResult<R = any> = SWRInfiniteResponse<R, XFetchError>;

export type UseXInfiniteOptions<R = any> = {
    requestInit?: XRequestInit;
    swr?: SWRInfiniteConfiguration<R, XFetchError>;
    onError?: (error: XFetchError) => void;
    onSuccess?: (data: R[] | undefined) => void;
    disabled?: boolean;
    /**
     * Ignores the fetch options of the `XContext`
     */
    ignoreContext?: boolean;
};

/**
 * @param urlLike The URL to fetch. Can be a path or a full URL. Use path variables like _/api/:id_.
 *
 * @template R Response type
 * @template Q Query parameters type
 * @template P Path variables type
 */
export function useXInfinite<R = any, Q extends Params = Params, P extends Params = Params>(
    urlLike: string | Disabled,
    params?: UseXInfiniteParams<Q, P> | Disabled,
    options?: UseXInfiniteOptions<R>
): UseXInfiniteResult<R> {
    const ctx = useXContext();
    const started = React.useRef(false);

    const parsedPath = React.useMemo<string | null>(() => {
        // control disabled by checking if params or urlLike is falsy
        if (!params || !urlLike || options?.disabled) return null;
        return params.pathVariables ? replacePathVariables(urlLike, params.pathVariables) : urlLike;
    }, [urlLike, params && params?.pathVariables]);

    const infinite = useSWRInfinite<R, XFetchError>(
        (index, previousData) => {
            if (!params || !parsedPath) return null;

            const fetcherParams: FetcherParams & { index: number; infinite: boolean } = {
                path: parsedPath,
                queryParams:
                    typeof params.queryParams === "function"
                        ? params.queryParams(index, previousData)
                        : params.queryParams,
                index,
                infinite: true,
            };

            return fetcherParams;
        },
        {
            fetcher: createFetcher<R>(
                options?.ignoreContext ? {} : ctx.requestInit,
                options?.ignoreContext ? {} : ctx.infiniteRequestInit,
                options?.requestInit || {}
            ),
            ...options?.swr,
        }
    );

    React.useEffect(() => {
        if (infinite.isValidating) {
            started.current = true;
        }

        // check if started. isValidating can idle to false if the query mounts as disabled
        if (!infinite.isValidating && started.current && options?.onSuccess) {
            options.onSuccess(infinite.data);
        }
    }, [infinite.isValidating]);

    React.useEffect(() => {
        if (infinite.error && options?.onError) {
            options.onError(infinite.error);
        }
    }, [infinite.error]);

    return infinite;
}
