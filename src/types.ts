import { XRequestInit } from "@edgeshiftlabs/xfetch";
import { Params } from "./helpers.js";

export interface StaticParams<P extends Params = Params, Q extends Params = Params, B = any> {
    queryParams?: Q;
    body?: B;
    pathVariables?: P;
}

export interface FetcherArgs<Q extends Params = Params, B = any> {
    queryParams?: Q;
    body?: B;
}

export type RequestInitPart<P extends Params = Params, Q extends Params = Params, B = any> = StaticParams<
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
    url: string;
    body?: any;
    queryParams?: Params | undefined;
    index?: number;
    infinite?: boolean;
};
