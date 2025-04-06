"use client";

import { XFetchError, XRequestInit } from "@edgeshiftlabs/xfetch";
import { useXContext, XContext } from "./xcontext.js";
import { Params } from "./helpers.js";
import { createFetcher } from "./fetcher.js";
import useSWRMutation, { SWRMutationConfiguration, SWRMutationResponse } from "swr/mutation";
import { FetcherArgs, StaticParams, XCacheKey } from "./types.js";

export type UseXMutationParams<B = any, Q extends Params = Params> = FetcherArgs<Q, B>;

export type UseXMutation<R = any, B = any, Q extends Params = Params> = SWRMutationResponse<
    R,
    XFetchError,
    XCacheKey,
    UseXMutationParams<B, Q>
>;

export type UseXMutationOptions<R = any, B = any, Q extends Params = Params, G = R> = {
    requestInit?: XRequestInit;
    swr?: SWRMutationConfiguration<R, XFetchError, XCacheKey, UseXMutationParams<B, Q>, G> & {
        throwOnError?: boolean;
    };
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
 * Method default to POST.
 *
 * Default SWR options:
 * - `populateCache: false`
 * - `revalidate: true`
 *
 * @param urlLike The URL to fetch. Can be a path or a full URL. Use path variables like _/api/:id_.
 * @param params Static params to merge the trigger ars with.
 *
 * @template R Response type
 * @template B Body type
 * @template P Path variables type
 * @template Q Query parameters type
 * @template G Get type - The type returned by `useSWR` for the same path. Defaults to `R`
 */
export function useXMutation<R = any, B = any, P extends Params = Params, Q extends Params = Params, G = R>(
    urlLike: string,
    params: StaticParams<P, Q, B>,
    options?: UseXMutationOptions<R, B, Q, G>
): UseXMutation<R, B, Q> {
    const ctx = useXContext();
    const { key, fetcher } = createFetcher(
        urlLike,
        { method: "POST" },
        options?.ignoreContext ? {} : ctx.requestInit,
        options?.ignoreContext ? {} : ctx.mutationsRequestInit,
        options?.requestInit || {},
        {
            queryParams: params.queryParams,
            pathVariables: params.pathVariables,
            body: params.body,
        }
    );

    const mutation = useSWRMutation<R, XFetchError, XCacheKey, UseXMutationParams<B, Q>, G>(key, fetcher, {
        populateCache: false,
        revalidate: true,
        ...options?.swr,
    });

    return mutation;
}
