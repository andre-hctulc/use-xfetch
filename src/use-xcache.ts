import { useSWRConfig } from "swr";
import { XCacheKey } from "./types.js";
import { useCallback } from "react";
import { isCacheKey } from "./helpers.js";

interface UseXCacheResult {
    mutate: (match: (key: XCacheKey) => boolean, data?: any) => Promise<void>;
}

export function useXCache(): UseXCacheResult {
    const { mutate } = useSWRConfig();
    const _mutate = useCallback(
        async (match: (key: XCacheKey) => boolean, data?: any) => {
            await mutate((key: unknown) => {
                if (!isCacheKey(key)) {
                    return;
                }
                return match(key);
            }, data);
        },
        [mutate]
    );

    return { mutate: _mutate };
}
