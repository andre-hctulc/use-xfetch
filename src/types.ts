import { FetcherParams } from "./fetcher.js";

/**
 * The Keys used to cache
 */
export type XFetchCacheKey = FetcherParams & { index?: number; infinite?: boolean };
