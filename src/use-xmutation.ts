"use client";

import { XFetchError, XRequestInit } from "@edgeshiftlabs/xfetch";
import { useXContext, XContext } from "./xcontext.js";
import { createFetcher } from "./fetcher.js";
import useSWRMutation, { SWRMutationConfiguration, SWRMutationResponse } from "swr/mutation";
import { Disabled, FetcherArgs, Params, PartialFetcherArgs, XCacheKey } from "./types.js";

export type UseXMutation<
    R = any,
    B = any,
    P extends Params = Params,
    Q extends Params = Params
> = SWRMutationResponse<R, XFetchError, XCacheKey, FetcherArgs<P, Q, B>>;

export type UseXMutationOptions<
    R = any,
    B = any,
    P extends Params = Params,
    Q extends Params = Params,
    G = R
> = {
    requestInit?: XRequestInit;
    swr?: Omit<SWRMutationConfiguration<R, XFetchError, XCacheKey, FetcherArgs<P, Q, B>, G>, "fetcher">;
    method?: string;
    /**
     * Ignores the fetch options of the {@link XContext}
     */
    ignoreContext?: boolean;
    /**
     * Adds a custom part to the SWR key, to further distinguish the request.
     */
    customKeyPart?: any;
};

/**
 * Method default to _POST_.
 *
 * Default SWR options:
 * - `populateCache: false`
 * - `revalidate: true`
 *
 * @param urlLike The URL to fetch. Can be a path or a full URL. Use path variables like _/api/:id_.
 * @param params Static (partial) params to merge the trigger args with.
 *
 * @template R Response type
 * @template B Body type
 * @template P Path variables type
 * @template Q Query parameters type
 * @template G Get type - The type returned by `useSWR` for the same path. Defaults to `R`
 */
export function useXMutation<R = any, B = any, P extends Params = Params, Q extends Params = Params, G = R>(
    urlLike: string,
    params: PartialFetcherArgs<P, Q, B> | Disabled,
    options?: UseXMutationOptions<R, B, P, Q, G>
): UseXMutation<R, B, P, Q> {
    const ctx = useXContext();
    const { key, fetcher } = params
        ? createFetcher(
              urlLike,
              options?.customKeyPart,
              options?.ignoreContext ? {} : ctx.requestInit,
              options?.ignoreContext ? {} : ctx.mutationsRequestInit,
              options?.requestInit || {},
              // Set method
              { method: options?.method ?? options?.requestInit?.method ?? "POST" },
              {
                  // paths vars and query is merged with other objects
                  queryParams: params.queryParams,
                  pathVariables: params.pathVariables,
                  body: params.body ?? options?.requestInit?.body,
              }
          )
        : {
              key: { urlLike: "$$invalid" },
              fetcher: () => {
                  throw new XFetchError("", "Mutation disabled", null, undefined);
              },
          };

    const mutation = useSWRMutation<R, XFetchError, XCacheKey, FetcherArgs<P, Q, B>, G>(key, fetcher, {
        populateCache: false,
        revalidate: true,
        ...options?.swr,
    });

    return mutation;
}
