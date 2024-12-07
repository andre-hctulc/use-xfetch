import { xfetch, XRequestInit } from "@andre-hctulc/xfetch";
import { Params } from "./helpers.js";

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

function mergeRequestInits(...objs: XRequestInit[]) {
    const result: XRequestInit = {};
    const headers: Headers = new Headers();
    const searchParams: URLSearchParams = new URLSearchParams();

    objs.forEach((obj) => {
        Object.entries(obj).forEach(([key, value]) => {
            if (value === undefined) return;

            // merge headers
            if (key === "headers") {
                if (value instanceof Headers) {
                    value.forEach((headerVal, headerName) => headers.set(headerName, headerVal));
                } else if (value) {
                    Object.entries(value).forEach(([headerName, headerVal]) =>
                        headers.append(headerName, headerVal as any)
                    );
                }
            }
            // merge searchParams
            else if (key === "queryParams") {
                if (value instanceof URLSearchParams) {
                    value.forEach((paramVal, paramName) => searchParams.set(paramName, paramVal));
                } else if (value) {
                    Object.entries(value).forEach(([paramName, paramVal]) =>
                        searchParams.set(paramName, paramVal as any)
                    );
                }
            }
            // merge the rest
            else {
                result[key as keyof XRequestInit] = value;
            }
        });
    });

    result.headers = headers;
    result.queryParams = searchParams;

    return result;
}
