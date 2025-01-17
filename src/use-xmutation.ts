"use client";

import { XRequestInit, XFetchError, xmutate } from "@andre-hctulc/xfetch";
import React from "react";
import { useXContext, XContext } from "./xcontext.js";
import { Disabled, mergeRequestInit, Params, replacePathVariables } from "./helpers.js";

export interface UseXMutationParams<B = any, Q extends Params = Params, P extends Params = Params> {
    pathVariables?: P;
    queryParams?: Q;
    body?: B;
}

/*
NOTE
We return a result object in the mutation functions, 
so we can differentiate between undefined (= error) and undefined (= no data). 
*/

export type UseXMutation<B = any, R = any, Q extends Params = Params, P extends Params = Params> = {
    del: (
        params: UseXMutationParams<B, Q, P>,
        requestInit?: XRequestInit
    ) => Promise<{ data: R; error: null } | { data: undefined; error: XFetchError }>;
    post: (
        params: UseXMutationParams<B, Q, P>,
        requestInit?: XRequestInit
    ) => Promise<{ data: R; error: null } | { data: undefined; error: XFetchError }>;
    put: (
        params: UseXMutationParams<B, Q, P>,
        requestInit?: XRequestInit
    ) => Promise<{ data: R; error: null } | { data: undefined; error: XFetchError }>;
    mutate: (
        method: string,
        params: UseXMutationParams<B, Q, P>,
        requestInit?: XRequestInit
    ) => Promise<{ data: R; error: null } | { data: undefined; error: XFetchError }>;
    error: XFetchError | null;
    isSuccess: boolean;
    isMutating: boolean;
    isError: boolean;
    data: R | undefined;
};

type SuccessData<R> = Exclude<R, undefined> extends never ? undefined : Exclude<R, undefined>;

export type UseXMutationOptions<R = any> = {
    /**
     * Static path variables. These are overwritten by the path variables in the params.
     */
    pathVariables?: Params;
    requestInit?: XRequestInit;
    onSuccess?: (data: SuccessData<R>) => void;
    onError?: (error: XFetchError) => void;
    onResponse?: (data: R | undefined, error: XFetchError | null) => void;
    /**
     * Ignores the fetch options of the {@link XContext}
     */
    ignoreContext?: boolean;
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
): UseXMutation<B, R, Q, P> {
    const ctx = useXContext();
    const [error, setError] = React.useState<XFetchError | null>(null);
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
                const err = new XFetchError(method, "Disabled", null, "useXMutation");
                setError(err);
                setIsSuccess(false);
                setIsMutating(false);
                setData(undefined);
                return { error: err, data: undefined };
            }

            setError(null);
            setIsSuccess(false);
            setIsMutating(true);
            setData(undefined);

            const parsedPath =
                params.pathVariables || options?.pathVariables
                    ? replacePathVariables(urlLike, { ...options?.pathVariables, ...params.pathVariables })
                    : urlLike;

            return xmutate<R, B>(
                method,
                parsedPath,
                params.body!,
                mergeRequestInit(
                    options?.ignoreContext ? {} : ctx.requestInit,
                    options?.ignoreContext ? {} : ctx.mutationsRequestInit,
                    options?.requestInit || {},
                    requestInit || {}
                )
            )
                .then((responseData) => {
                    if (!currentAbortController.signal.aborted) {
                        setIsSuccess(true);
                        setError(null);
                        setData(responseData);
                    }

                    return { data: responseData, error: null };
                })
                .catch((err) => {
                    if (!currentAbortController.signal.aborted) {
                        setError(err);
                        setIsSuccess(false);
                        setData(undefined);
                    }

                    return { error: err, data: undefined };
                })
                .finally(() => {
                    if (!currentAbortController.signal.aborted) setIsMutating(false);
                });
        },
        [urlLike, options, ctx]
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
        if (isSuccess) {
            options?.onSuccess?.(data as SuccessData<R>);
            options?.onResponse?.(data, null);
        }
    }, [isSuccess]);

    React.useEffect(() => {
        if (error) {
            options?.onError?.(error);
            options?.onResponse?.(undefined, error);
        }
    }, [error]);

    const mutation = React.useMemo(
        () => ({ del, post, put, mutate, error, isSuccess, isMutating, isError, data }),
        [del, post, put, mutate, error, isSuccess, isMutating, isError, data]
    );

    return mutation;
}
