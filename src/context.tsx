"use client";

import { XRequestInit } from "@andre-hctulc/xfetch";
import React from "react";

interface XFetchContext {
    requestInit: Partial<XRequestInit>;
    mutationsRequestInit: Partial<XRequestInit>;
    fetchesRequestInit: Partial<XRequestInit>;
}

const XFetchContext = React.createContext<XFetchContext | undefined>(undefined);

export function useXFetchContext(): XFetchContext {
    const context = React.useContext(XFetchContext);
    if (!context) {
        return { requestInit: {}, mutationsRequestInit: {}, fetchesRequestInit: {} };
    }
    return context;
}

export interface XFetchProviderProps {
    children?: React.ReactNode;
    requestInit?: Partial<XRequestInit>;
    mutationsRequestInit?: Partial<XRequestInit>;
    fetchesRequestInit?: Partial<XRequestInit>;
}

/**
 * Lets you configure the default requestInit useXFetch hooks in the component tree.
 */
export function XFetchProvider({
    children,
    requestInit,
    mutationsRequestInit,
    fetchesRequestInit,
}: XFetchProviderProps) {
    return (
        <XFetchContext.Provider
            value={{
                requestInit: requestInit || {},
                mutationsRequestInit: mutationsRequestInit || {},
                fetchesRequestInit: fetchesRequestInit || {},
            }}
        >
            {children}
        </XFetchContext.Provider>
    );
}
