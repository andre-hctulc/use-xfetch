"use client";

import { FetchError, xfetch, xmutate, type XRequestInit } from "@andre-hctulc/xfetch";
import React from "react";
import type { SWRConfiguration, SWRResponse } from "swr";
import useSWR from "swr";
import { useXFetchContext } from "./context.js";

/* 
NOTE
"use client" is required!
*/

/**
 * Replaces path variables in the path with the values from the pathVariables object.
 *
 * Path variables are defined as `:variable`.
 *
 * If the value for a path variable is not found, the variable is left as a placeholder.
 */
const replacePathVariables = (path: string, pathVariables: Record<string, string>) => {
    return path.replace(/:([a-zA-Z0-9_]+)/g, (_, variable) => {
        const value = pathVariables[variable];
        // If the value is falsy, return the variable as a placeholder
        if (value === undefined) return `:${variable}`;
        // stringify the value
        return value + "";
    });
};

type Params = Record<string, any>;

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

export type Disabled = null | false | undefined | "" | 0;

export type UseXFetchResult<R> = SWRResponse<R, FetchError>;

export type UseXFetchOptions<R> = {
    requestInit?: XRequestInit;
    swr?: SWRConfiguration<R, FetchError>;
    onError?: (error: FetchError) => void;
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
    const ctx = useXFetchContext();
    const started = React.useRef(false);
    /**
     * Hash of the path variables object. Used to reduce the number of times the path is parsed.
     */
    const pathVarsHash = React.useMemo<string>(() => {
        if (!params) return "";
        return Object.entries(params?.pathVariables || {})
            .map(([key, value]) => `${key}:${value}`)
            .join(",");
    }, [params && params?.pathVariables]);
    const parsedPath = React.useMemo<string | null>(() => {
        // control disabled by checking if params or urlLike is falsy
        if (!params || !urlLike || options?.disabled) return null;
        return params.pathVariables ? replacePathVariables(urlLike, params.pathVariables) : urlLike;
    }, [urlLike, pathVarsHash]);

    const query = useSWR<R, FetchError>(params && parsedPath ? { path: parsedPath, params } : null, {
        fetcher: (fetcherParams: { path: string; params: UseXFetchParams }) => {
            return xfetch<R>(fetcherParams.path, {
                ...ctx.requestInit,
                ...ctx.fetchesRequestInit,
                ...options?.requestInit,
                queryParams: {
                    ...ctx.requestInit.queryParams,
                    ...ctx.fetchesRequestInit.queryParams,
                    ...options?.requestInit?.queryParams,
                    ...fetcherParams.params?.queryParams,
                },
            });
        },
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

export interface UseXMutationParams<B, Q extends Params = Params, P extends Params = Params> {
    pathVariables?: P;
    queryParams?: Q;
    body?: B;
}

/*
NOTE
We return a result object in the mutation functions, 
so we can differentiate between undefined (= error) and undefined (= no data). 
*/

export type UseXMutateResult<B, R, Q extends Params = Params, P extends Params = Params> = {
    del: (
        params: UseXMutationParams<B, Q, P>,
        requestInit?: XRequestInit
    ) => Promise<{ data: R } | undefined>;
    post: (
        params: UseXMutationParams<B, Q, P>,
        requestInit?: XRequestInit
    ) => Promise<{ data: R } | undefined>;
    put: (
        params: UseXMutationParams<B, Q, P>,
        requestInit?: XRequestInit
    ) => Promise<{ data: R } | undefined>;
    mutate: (
        method: string,
        params: UseXMutationParams<B, Q, P>,
        requestInit?: XRequestInit
    ) => Promise<{ data: R } | undefined>;
    error: FetchError | null;
    isSuccess: boolean;
    isMutating: boolean;
    isError: boolean;
    data: R | undefined;
};

type SuccessData<R> = Exclude<R, undefined> extends never ? undefined : Exclude<R, undefined>;

export type UseXMutationOptions<R> = {
    requestInit?: XRequestInit;
    onSuccess?: (data: SuccessData<R>) => void;
    onError?: (error: FetchError) => void;
};

/**
 * @param urlLike The URL to fetch. Can be a path or a full URL. Use path variables like _/api/:id_.
 *
 * @template B Body type
 * @template R Response type
 * @template Q Query parameters type
 * @template P Path variables type
 */
export function useXMutation<B = any, R = any, Q extends Params = Params, P extends Params = Params>(
    urlLike: string | Disabled,
    options?: UseXMutationOptions<R>
): UseXMutateResult<B, R, Q, P> {
    const ctx = useXFetchContext();
    const [error, setError] = React.useState<FetchError | null>(null);
    const [isMutating, setIsMutating] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const [data, setData] = React.useState<R | undefined>(undefined);
    const isError = error !== null;
    const abortController = React.useRef<AbortController | null>(null);

    const mutate = React.useCallback(
        async (method: string, params: UseXMutationParams<B>, requestInit?: XRequestInit) => {
            if (abortController.current) {
                abortController.current.abort();
            }

            const currentAbortController = (abortController.current = new AbortController());

            if (!urlLike) {
                setError(new FetchError(method, "Disabled", null, "useXMutation"));
                setIsSuccess(false);
                setIsMutating(false);
                setData(undefined);
                return undefined;
            }

            setError(null);
            setIsSuccess(false);
            setIsMutating(true);
            setData(undefined);

            const parsedPath = params.pathVariables
                ? replacePathVariables(urlLike, params.pathVariables)
                : urlLike;

            return xmutate<R, B>(method, parsedPath, params.body!, {
                ...ctx.requestInit,
                ...ctx.mutationsRequestInit,
                ...options?.requestInit,
                ...requestInit,
            })
                .then((responseData) => {
                    if (!currentAbortController.signal.aborted) {
                        setIsSuccess(true);
                        setError(null);
                        setData(responseData);
                    }

                    return { data: responseData };
                })
                .catch((err) => {
                    if (!currentAbortController.signal.aborted) {
                        setError(err);
                        setIsSuccess(false);
                        setData(undefined);
                    }
                    throw err;
                })
                .finally(() => {
                    if (!currentAbortController.signal.aborted) setIsMutating(false);
                });
        },
        [urlLike]
    );
    const del = React.useCallback(
        (params: UseXMutationParams<B>, requestInit?: XRequestInit) => mutate("DELETE", params, requestInit),
        [mutate]
    );
    const post = React.useCallback(
        (params: UseXMutationParams<B>, requestInit?: XRequestInit) => mutate("POST", params, requestInit),
        [mutate]
    );
    const put = React.useCallback(
        (params: UseXMutationParams<B>, requestInit?: XRequestInit) => mutate("PUT", params, requestInit),
        [mutate]
    );

    React.useEffect(() => {
        if (isSuccess && options?.onSuccess) {
            options.onSuccess(data as SuccessData<R>);
        }
    }, [isSuccess]);

    React.useEffect(() => {
        if (error && options?.onError) {
            options.onError(error);
        }
    }, [error]);

    // Cleanup
    React.useEffect(() => {
        return () => {
            if (abortController.current) {
                abortController.current.abort();
            }
        };
    }, []);

    const mutation = React.useMemo(
        () => ({ del, post, put, mutate, error, isSuccess, isMutating, isError, data }),
        [del, post, put, mutate, error, isSuccess, isMutating, isError, data]
    );

    return mutation;
}
