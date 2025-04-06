import { xfetch } from "@edgeshiftlabs/xfetch";
import { mergeRequestInit as mergeParams, replacePathVariables } from "./helpers.js";
import { RequestInitPart, XCacheKey } from "./types.js";

/**
 * Latter request inits take precedence over the former ones.
 */
export function createFetcher(
    urlLike: string,
    ...staticParams: RequestInitPart[]
): { fetcher: (args: XCacheKey) => Promise<any>; key: XCacheKey } {
    const staticArgs = mergeParams(...staticParams);
    const url = replacePathVariables(urlLike, staticArgs.pathVariables || {});

    const fetcher = (args: XCacheKey) => {
        // We cannot mutate the url inside fetcher,
        // // because the fetch url would mismatch the url in the swr key
        const dynamicArgs = mergeParams(staticArgs, args);
        return xfetch(url, dynamicArgs);
    };

    const key: XCacheKey = {
        url,
        queryParams: staticArgs.queryParams || {},
        body: staticArgs.body,
    };

    return {
        key,
        fetcher,
    };
}
