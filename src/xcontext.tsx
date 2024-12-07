"use client";

import { XRequestInit } from "@andre-hctulc/xfetch";
import React from "react";

export interface XContext {
    requestInit: Partial<XRequestInit>;
    mutationsRequestInit: Partial<XRequestInit>;
    fetchesRequestInit: Partial<XRequestInit>;
    infiniteRequestInit: Partial<XRequestInit>;
}

const XContext = React.createContext<XContext | undefined>(undefined);

export function useXContext(): XContext {
    const context = React.useContext(XContext);
    if (!context) {
        return { requestInit: {}, mutationsRequestInit: {}, fetchesRequestInit: {}, infiniteRequestInit: {} };
    }
    return context;
}

export interface XProviderProps {
    children?: React.ReactNode;
    requestInit?: Partial<XRequestInit>;
    mutationsRequestInit?: Partial<XRequestInit>;
    fetchesRequestInit?: Partial<XRequestInit>;
    infiniteRequestInit?: Partial<XRequestInit>;
}

/**
 * Lets you configure the default requestInit useXFetch hooks in the component tree.
 */
export function XProvider({
    children,
    requestInit,
    mutationsRequestInit,
    fetchesRequestInit,
    infiniteRequestInit,
}: XProviderProps) {
    return (
        <XContext.Provider
            value={{
                requestInit: requestInit || {},
                mutationsRequestInit: mutationsRequestInit || {},
                fetchesRequestInit: fetchesRequestInit || {},
                infiniteRequestInit: infiniteRequestInit || {},
            }}
        >
            {children}
        </XContext.Provider>
    );
}
