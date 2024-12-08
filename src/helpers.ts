import { XRequestInit } from "@andre-hctulc/xfetch";

/**
 * Replaces path variables in the path with the values from the pathVariables object.
 *
 * Path variables are defined as `:variable`.
 *
 * If the value for a path variable is not found, the variable is left as a placeholder.
 */
export const replacePathVariables = (path: string, pathVariables: Record<string, string>) => {
    return path.replace(/:([a-zA-Z0-9_]+)/g, (_, variable) => {
        const value = pathVariables[variable];
        // If the value is falsy, return the variable as a placeholder
        if (value === undefined) return `:${variable}`;
        // stringify the value
        return value + "";
    });
};

export type Params = Record<string, any>;

export type Disabled = null | false | undefined | "" | 0;

/**
 * Merges multiple request init objects. Latter request inits take precedence over the former ones.
 */
export function mergeRequestInits(...objs: XRequestInit[]) {
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
                    Object.entries(value).forEach(([paramName, paramVal]) => {
                        if (Array.isArray(paramVal)) {
                            searchParams.delete(paramName);
                            paramVal.forEach((paramVal) => searchParams.append(paramName, paramVal as any));
                        } else {
                            searchParams.set(paramName, paramVal as any);
                        }
                    });
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
