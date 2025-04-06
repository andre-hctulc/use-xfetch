import { XRequestInit } from "@edgeshiftlabs/xfetch";
import { Params } from "./helpers.js";

export interface FetcherArgs<P extends Params = Params, Q extends Params = Params, B = any> {
    queryParams?: Q;
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
 * The Keys used to cache
 *
 * {@link FetcherArgs} must be a subset of this
 */
export type XCacheKey = {
    urlLike: string;
    pathVariables?: Params;
    custom?: any;
    queryParams?: Params;
    index?: number;
    infinite?: boolean;
};
