export interface CachedDataInterface {
    key: string;
    expirationDate: number;
    val: any;
}

export interface SetCacheInterface {
    key: string;
    val: any;
    durationInMinutes?: number;
}
