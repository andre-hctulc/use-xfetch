import { XFetchError, XRequestInit } from "@dre44/xfetch";
import { Params, SafeResult, XCacheKey } from "./types.js";

/**
 * Replaces path variables in the path with the values from the pathVariables object.
 *
 * Path variables are defined as `:variable`.
 *
 * If the value for a path variable is not found, the variable is left as a placeholder.
 */
export const replacePathVariables = (path: string, pathVariables: Record<string, string | undefined>) => {
    return path.replace(/:([a-zA-Z0-9_]+)/g, (_, variable) => {
        const value = pathVariables[variable];
        // If the value is falsy, return the variable as a placeholder
        if (value === undefined) return `:${variable}`;
        // stringify the value
        return value + "";
    });
};

/**
 * Merges multiple request init objects. Latter request inits take precedence over the former ones.
 */
export function mergeRequestInit(
    ...objs: (XRequestInit & { pathVariables?: Params })[]
): XRequestInit & { pathVariables?: Params | undefined } {
    const result: XRequestInit & { pathVariables?: Params | undefined } = {};
    const headers: Headers = new Headers();
    const searchParams: Record<string, string[]> = {};
    const pathVariables: Params = {};

    objs.forEach((obj) => {
        if (!obj) return;

        Object.entries(obj).forEach(([key, value]) => {
            if (value === undefined) return;

            // merge headers
            if (key === "headers") {
                if (value instanceof Headers) {
                    value.forEach((headerVal, headerName) => headers.append(headerName, headerVal));
                } else if (Array.isArray(value)) {
                    value.forEach(([headerName, headerVal]) => {
                        if (headerVal === undefined) return;
                        headers.append(headerName, headerVal as any);
                    });
                } else if (value && typeof obj === "object") {
                    Object.entries(value).forEach(([headerName, headerVal]) => {
                        if (headerVal === undefined) return;

                        if (Array.isArray(headerVal)) {
                            headerVal.forEach((val) => {
                                headers.append(headerName, val as any);
                            });
                        } else {
                            headers.append(headerName, headerVal as any);
                        }
                    });
                }
            }
            // merge searchParams
            else if (key === "queryParams") {
                if (value instanceof URLSearchParams) {
                    value.forEach((paramVal, paramName) => {
                        if (paramVal === undefined) return;
                        searchParams[paramName] = searchParams[paramName] || [];
                        searchParams[paramName].push(paramVal);
                    });
                } else if (value) {
                    Object.entries(value).forEach(([paramName, paramVal]) => {
                        if (paramVal === undefined) return;

                        searchParams[paramName] = searchParams[paramName] || [];

                        if (Array.isArray(paramVal)) {
                            paramVal.forEach((val) => {
                                searchParams[paramName].push(val as any);
                            });
                        } else {
                            searchParams[paramName].push(paramVal as any);
                        }
                    });
                }
            } else if (key === "pathVariables") {
                Object.entries(value || {}).forEach(([paramName, paramVal]) => {
                    if (paramVal !== undefined) {
                        pathVariables[paramName] = paramVal;
                    }
                });
            }
            // rest overwrites previous values
            else {
                result[key as keyof XRequestInit] = value;
            }
        });
    });

    result.headers = headers;
    result.queryParams = searchParams;
    result.pathVariables = pathVariables;

    return result;
}

export function isCacheKey(key: unknown): key is XCacheKey {
    return typeof key === "object" && !!key && typeof (key as XCacheKey).urlLike === "string";
}

/**
 * Safely awaits a `mutate` Promise and returns the result.
 */
export async function safeTrigger<T>(
    trigger: Promise<T>,
    onError?: (error: XFetchError) => void
): Promise<SafeResult<T>> {
    try {
        const result = await trigger;
        return { data: result, error: null, success: true };
    } catch (error) {
        if (XFetchError.is(error)) {
            onError?.(error);
        }
        return { data: undefined, error: error as XFetchError, success: false };
    }
}
