import type { XFetchError, XRequestInit } from "@edgeshiftlabs/xfetch";

export type Params = Record<string, any>;

export type Disabled = null | false | undefined | "" | 0;
export interface FetcherArgs<P extends Params = Params, Q extends Params = Params, B = any> {
    queryParams?: Q;
    /**
     * The body is **not part of the swr key**!. Use `customKeyPart` to add custom key parts.
     */
    body?: B;
    /**
     * When used in dynamic context (mutation arg `trigger({pathVariables: {...}})`),
     * these will **not be reflected in the swr key** and therefore might interfere with other routes or cause other issues,
     * so use it carefully!
     */
    pathVariables?: P;
}

export interface PartialFetcherArgs<P extends Params = Params, Q extends Params = Params, B = any> {
    queryParams?: Partial<Q>;
    body?: B;
    pathVariables?: Partial<P>;
}

export type RequestInitPart<P extends Params = Params, Q extends Params = Params, B = any> = FetcherArgs<
    P,
    Q,
    B
> &
    XRequestInit;

/**
 * Keys used in SWR cache.
 */
export type XCacheKey = {
    urlLike: string;
    pathVariables?: Params;
    custom?: any;
    queryParams?: Params;
    index?: number;
    infinite?: boolean;
};

export type SafeResult<T> =
    | {
          data: T;
          error: null;
      }
    | {
          data: undefined;
          error: XFetchError;
      };
