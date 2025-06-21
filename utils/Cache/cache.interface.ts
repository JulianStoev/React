export interface cacheInterface {
    set: (cacheToSet: cacheToSetInterface, maxLimit?: number, timeInMinutes?: number) => void;
    get: (cacheName: string) => any;
    getPartial: (partialKey: string | string[], index?: number) => cachedDataInterface[];
    del: (cacheName: string) => boolean;
    delMultiple: (cacheArr: cachedDataInterface[]) => void;
    flush: () => void;
}

export interface cacheDataInterface {
    name: string; 
    reorder?: boolean;
}

export interface cacheObjInterface {
    [cacheName: string]: cachedDataInterface[];
}

export interface cachedDataInterface {
    key: string;
    expirationDate: number;
    val: any;
}

export interface cacheToSetInterface {
    key: string;
    val: any;
    durationInMinutes?: number;
}

export interface setCacheInterface {
    data: cacheToSetInterface;
    cachedData: cachedDataInterface[];
    cacheTime?: number;
    cacheLimit?: number;
    cacheReorder?: boolean;
}

export interface getPartialCacheInterface {
    partialKey: string | string[]; 
    cachedData: cachedDataInterface[];
    index?: number;
}
