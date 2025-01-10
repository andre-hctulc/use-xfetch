import { FetcherParams } from "./fetcher.js";

/**
 * The Keys used to cache
 */
export type UseXFetchCacheKey = FetcherParams & { index?: number; infinite?: boolean };
