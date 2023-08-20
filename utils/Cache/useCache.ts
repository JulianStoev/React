import { CachedDataInterface, SetCacheInterface } from './cache.interface';
import { useCallback } from 'react';

// persisting state outside of react
const cachedData: CachedDataInterface[] = [];
const cacheTime = (10 * 60 * 1000); // default cache duration
const maxCacheLength = 10; // maximum number of entries we keep

export default function useCacheHook() {

    // move this index on top
    const orderCache = useCallback((index: number): void => {
        cachedData.unshift(cachedData.splice(index, 1)[0]);
    }, []);

    // clean the cache from old data. Execute on setCache and getCache
    const cleanCache = useCallback((currentDate: number): void => {
        if (cachedData.length === 0) return;
        cachedData.forEach((item, index) => {
            if (item.expirationDate <= currentDate) {
                cachedData.splice(index, 1);
            }
        });
    }, []);

    const setCache = useCallback((data: SetCacheInterface): void => {
        const currentDate = new Date().getTime();
        const duration = (
            (data.durationInMinutes !== undefined)
                ? (data.durationInMinutes * 60 * 1000)
                : cacheTime
        );

        // clean the cache from old data
        cleanCache(currentDate);

        const newItem = {
            key: data.key,
            expirationDate: Math.floor(currentDate + duration),
            val: data.val
        };
        const index = cachedData.findIndex(c => c.key === data.key);
        // we have it already, update and reorder
        if (index !== -1) {
            cachedData[index] = newItem;
            orderCache(index);
        } else {
            // first time we add it
            cachedData.unshift(newItem);
            // check if the cache length has become more than the maximum and limit it if needed
            if (cachedData.length > maxCacheLength) {
                cachedData.length = maxCacheLength;
            }
        }
    }, [ cleanCache, orderCache ]);

    const getCache = useCallback((key: string): any => {
        const currentDate = new Date().getTime();
        // clean the cache from old data
        cleanCache(currentDate);

        const cacheIndex = cachedData.findIndex(c => c.key === key);
        // we don't have it
        if (cacheIndex === -1) {
            return null;
        }

        if (cachedData[cacheIndex].expirationDate <= currentDate) {
            // it's expired, remove it
            cachedData.splice(cacheIndex, 1);
            return null;
        }

        orderCache(cacheIndex);

        // prevent mutability
        // the order moved our item first so it's 0 index
        return JSON.parse(JSON.stringify(cachedData[0].val));
    }, [ cleanCache, orderCache ]);

    const deleteCache = useCallback((key: string): boolean => {
        const index = cachedData.findIndex(c => c.key === key);
        if (index === -1) {
            return false;
        }
        cachedData.splice(index, 1);
        return true;
    }, []);

    const flushCache = useCallback((): void => {
        cachedData.splice(0, cachedData.length);
    }, []);

    // you know the part of the key and eventual position, starting with it for example
    const getPartialCache = useCallback((partialKey: string, index: number): CachedDataInterface[] => {        
        return cachedData.filter(cache => {
            const filteredIndex = cache.key.indexOf(partialKey);
            if (filteredIndex === -1) {
                return false;
            }
            if (filteredIndex === index || index === undefined) {
                return true;
            }
            return false;
        });
    }, []);

    const deleteMultipleCache = useCallback((cacheKeys: string[]): void => {
        cacheKeys.forEach(key => deleteCache(key));
    }, [ deleteCache ]);

    return {
        getCache,
        setCache,
        deleteCache,
        flushCache,
        getPartialCache,
        deleteMultipleCache
    }
}