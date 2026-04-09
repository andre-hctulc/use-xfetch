import { useSWRConfig } from "swr";
import type { XCacheKey } from "./types.js";
import { useCallback } from "react";
import { isCacheKey } from "./helpers.js";

interface UseXCacheResult {
    mutate: (match: (key: XCacheKey) => boolean, data?: any) => Promise<any[]>;
}

export function useXCache(): UseXCacheResult {
    const { mutate } = useSWRConfig();
    const _mutate = useCallback(
        async (match: (key: XCacheKey) => boolean, data?: any) => {
            return mutate((key: unknown) => {
                if (!isCacheKey(key)) {
                    return false;
                }
                return match(key);
            }, data);
        },
        [mutate]
    );

    return { mutate: _mutate };
}
