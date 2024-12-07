import { xfetch, XRequestInit } from "@andre-hctulc/xfetch";
import { mergeRequestInits, Params } from "./helpers.js";

export interface FetcherParams {
    /**
     * Undefined values will be ignored. All other values will be stringified.
     */
    queryParams?: Params;
    /**
     * Path variables to replace in the URL. The values are stringified.
     */
    path: string;
}

/**
 * Latter request inits take precedence over the former ones.
 */
export function createFetcher<R>(...requestInit: XRequestInit[]): (params: FetcherParams) => Promise<R> {
    return ({ path, queryParams }: FetcherParams) =>
        xfetch<R>(path, mergeRequestInits(...requestInit, { queryParams } as XRequestInit));
}
