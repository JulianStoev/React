import { useCallback } from 'react';
import { 
    cacheInterface,
    cacheObjInterface,
    cachedDataInterface, 
    setCacheInterface,
    cacheToSetInterface,  
    getPartialCacheInterface,
    cacheDataInterface
} from 'Cache.interface';

// persisting state outside of react
const cacheObj: cacheObjInterface = {};
const cacheTime = (10 * 60 * 1000);

export default function useCache() {

    // move this index on top
    const orderCache = useCallback((index: number, cachedData: cachedDataInterface[]): void => {
        cachedData.unshift(cachedData.splice(index, 1)[0]);
    }, []);

    // clean the cache from old data. Execute on setCache and getCache
    const cleanCache = useCallback((currentDate: number, cachedData: cachedDataInterface[]): void => {
        if (cachedData.length === 0) return;
        cachedData.forEach((item, index) => {
            if (item.expirationDate <= currentDate) {
                cachedData.splice(index, 1);
            }
        });
    }, []);

    const setCache = useCallback((data: setCacheInterface): void => {
        const time = data.cacheTime || cacheTime;
        const limit = data.cacheLimit || 10;
        const reorder = data.cacheReorder || true;
        const currentDate = new Date().getTime();
        const duration = (
            (data.data.durationInMinutes !== undefined)
                ? (data.data.durationInMinutes * 60 * 1000)
                : time
        );

        // clean the cache from old data
        cleanCache(currentDate, data.cachedData);

        const newItem = {
            key: data.data.key,
            expirationDate: Math.floor(currentDate + duration),
            val: data.data.val
        };
        const index = data.cachedData.findIndex(c => c.key === data.data.key);
        // we have it already, update and reorder
        if (index !== -1) {
            data.cachedData[index] = newItem;
            if (reorder) {
                orderCache(index, data.cachedData);
            }
        } else {
            // first time we add it
            data.cachedData.unshift(newItem);
            // check if the cache length has become more than the maximum and limit it if needed
            if (data.cachedData.length > limit) {
                data.cachedData.length = limit;
            }
        }
    }, [ cleanCache, orderCache ]);

    const getCache = useCallback((key: string, cachedData: cachedDataInterface[], cacheReorder?: boolean): any => {
        const currentDate = new Date().getTime();
        const reorder = cacheReorder || true;
        // clean the cache from old data
        cleanCache(currentDate, cachedData);

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

        if (reorder) {
            orderCache(cacheIndex, cachedData);
        }

        // prevent accidental mutability
        return JSON.parse(JSON.stringify(cachedData[0].val));
    }, [ cleanCache, orderCache ]);

    const deleteCache = useCallback((key: string, cachedData: cachedDataInterface[]): boolean => {
        const index = cachedData.findIndex(c => c.key === key);
        if (index === -1) {
            return false;
        }
        cachedData.splice(index, 1);
        return true;
    }, []);

    const flushCache = useCallback((cachedData: cachedDataInterface[]): void => {
        cachedData.splice(0, cachedData.length);
    }, []);

    const getPartialCache = useCallback((data: getPartialCacheInterface): cachedDataInterface[] => { 
        return data.cachedData.filter((c: cachedDataInterface) => {
            let filteredIndex = -1;

            if (Array.isArray(data.partialKey)) {
                data.partialKey.some((item) => {
                    const index = c.key.indexOf(item);
                    if (index > -1) {
                        filteredIndex = index;
                        return true;
                    }
                    return false;
                });
            } else {
                filteredIndex = c.key.indexOf(data.partialKey);
            }

            if (filteredIndex === -1) {
                return false;
            }
            if (filteredIndex === data.index || data.index === undefined) {
                return true;
            }
            return false;
        });
    }, []);

    const deleteMultipleCache = useCallback((cacheArr: cachedDataInterface[], cachedData: cachedDataInterface[]): void => {
        cacheArr.forEach((item: cachedDataInterface) => {
            deleteCache(item.key, cachedData);
        });
    }, [ deleteCache ]);

    const accessCache = useCallback((data: cacheDataInterface): cacheInterface => {
        function Cache(data: cacheDataInterface): cacheInterface {
            if (cacheObj[data.name] === undefined) {
                cacheObj[data.name] = [] as cachedDataInterface[];
            }
    
            const set = (cacheToSet: cacheToSetInterface, maxLimit?: number, timeInMinutes?: number): void => {
                setCache({
                    data: cacheToSet,
                    cachedData: cacheObj[data.name],
                    cacheTime: timeInMinutes ? (timeInMinutes * 60 * 1000) : undefined,
                    cacheLimit: maxLimit,
                    cacheReorder: data.reorder
                });
            };
    
            const get = (cacheName: string): any => {
                return getCache(cacheName, cacheObj[data.name], data.reorder);
            };
    
            const getPartial = (partialKey: string | string[], index?: number): cachedDataInterface[] => {
                return getPartialCache({ partialKey, cachedData: cacheObj[data.name], index });
            };
    
            const del = (cacheName: string): boolean => {
                return deleteCache(cacheName, cacheObj[data.name]);
            };
    
            const delMultiple = (cacheArr: cachedDataInterface[]): void => {
                deleteMultipleCache(cacheArr, cacheObj[data.name]);
            };
    
            const flush = (): void => {
                flushCache(cacheObj[data.name]);
            };
            
            return {
                set,
                get,
                getPartial,
                del,
                delMultiple,
                flush
            }
        }

        return new (Cache as any)(data);
    }, [ setCache, getCache, getPartialCache, deleteCache, deleteMultipleCache, flushCache ]);

    return {
        accessCache
    }
}
