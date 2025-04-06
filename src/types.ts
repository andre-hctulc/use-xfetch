import { XRequestInit } from "@edgeshiftlabs/xfetch";
import { Params } from "./helpers.js";

export interface FetcherArgs<P extends Params = Params, Q extends Params = Params, B = any> {
    queryParams?: Q;
    body?: B;
    pathVariables?: P;
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
    body?: any;
    queryParams?: Params;
    index?: number;
    infinite?: boolean;
};
