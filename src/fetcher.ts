import { xfetch } from "@dre44/xfetch";
import { mergeRequestInit as mergeParams, replacePathVariables } from "./helpers.js";
import { FetcherArgs, RequestInitPart, XCacheKey } from "./types.js";

/**
 * Latter request inits take precedence over the former ones.
 */
export function createFetcher(
    urlLike: string,
    customKeyPart: any,
    ...staticParams: RequestInitPart[]
): { fetcher: (args: XCacheKey) => Promise<any>; key: XCacheKey } {
    const staticArgs = mergeParams(...staticParams);

    // `key` - given in `useSWR`, `useInfinite and, `useSWRMutation` context
    // `arg` - given in `useSWRMutation` context
    const fetcher = (key: XCacheKey, { arg }: { arg?: FetcherArgs } = {}) => {
        // Caution: `arg` is not reflected in swr key (especially `arg.pathVariables`).
        const dynamicArgs = mergeParams(
            {
                ...staticArgs,
                pathVariables: key.pathVariables,
                queryParams: key.queryParams,
            },
            arg || {}
        );
        const url = replacePathVariables(urlLike, dynamicArgs.pathVariables || {});
        return xfetch(url, dynamicArgs);
    };

    const key: XCacheKey = {
        urlLike,
        pathVariables: staticArgs.pathVariables,
        queryParams: staticArgs.queryParams || {},
        custom: customKeyPart,
    };

    return {
        key,
        fetcher,
    };
}
