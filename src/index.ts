import { FetchError, xfetch, xmutate, type XRequestInit } from "@andre-hctulc/xfetch";
import React from "react";
import type { SWRConfiguration } from "swr";
import useSWR from "swr";

const replacePathVariables = (path: string, pathVariables: Record<string, string>) => {
    return path.replace(/\{([^}]+)\}/g, (_, key) => {
        if (key in pathVariables) {
            return pathVariables[key] + "";
        }
        return `{${key}}`;
    });
};

export interface UseXFetchParams {
    queryParams?: Record<string, string>;
    pathVariables?: Record<string, string>;
}

export type Disabled = null | false | undefined | "" | 0;

/**
 * Use path variables like this: _/api/project/{id}_
 */
export function useXFetch<T = any>(
    path: string,
    params: UseXFetchParams | Disabled,
    options?: { requestInit?: XRequestInit; swr?: SWRConfiguration<T, FetchError> }
) {
    const p = React.useMemo<string | null>(() => {
        if (!params) return null;
        return params.pathVariables ? replacePathVariables(path, params.pathVariables) : path;
    }, [path, !!params && params.pathVariables]);

    const query = useSWR<T, FetchError>(params && p ? { ...params, path } : null, {
        fetcher: (params) => {
            return xfetch<T>(params.path, {
                ...options?.requestInit,
                queryParams: { ...options?.requestInit, ...params.searchParams },
            });
        },
        ...options?.swr,
    });

    return query;
}

export interface UseXMutationParams<B> {
    pathVariables?: Record<string, string>;
    queryParams?: Record<string, string>;
    data?: B;
}

/**
 * Use path variables like this: _/api/project/{id}_
 */
export function useXMutation<R, B>(path: string, options?: { requestInit?: XRequestInit }) {
    const [error, setError] = React.useState<FetchError | null>(null);
    const [isMutating, setIsMutating] = React.useState(false);
    const [isSuccess, setIsSuccess] = React.useState(false);
    const isError = error !== null;
    const abortSignal = React.useRef<AbortController | null>(null);

    const mutate = React.useCallback(
        (method: string, params: UseXMutationParams<B>, requestInit?: XRequestInit) => {
            if (abortSignal.current) {
                abortSignal.current.abort();
            }

            const currentAbortSignal = (abortSignal.current = new AbortController());

            setError(null);
            setIsSuccess(false);
            setIsMutating(true);

            const p = params.pathVariables ? replacePathVariables(path, params.pathVariables) : path;

            return xmutate<R, B>(method, p, params.data!, { ...options?.requestInit, ...requestInit })
                .then((responseData) => {
                    if (!currentAbortSignal.signal.aborted) {
                        setIsSuccess(true);
                        setError(null);
                    }

                    return responseData;
                })
                .catch((err) => {
                    if (!currentAbortSignal.signal.aborted) {
                        setError(err);
                        setIsSuccess(false);
                    }
                    throw err;
                })
                .finally(() => {
                    if (!currentAbortSignal.signal.aborted) setIsMutating(false);
                });
        },
        []
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

    return { del, post, put, mutate, error, isSuccess, isMutating, isError };
}
