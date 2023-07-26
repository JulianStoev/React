// Binary Search 1.0
// https://github.com/JulianStoev

import { useCallback } from "react";

import { binarySearchInterface } from "./BinarySearch.interface";


export default function useBinarySearchHook() {

    const binarySearch = useCallback((data: binarySearchInterface) => {
        let start = 0;
        let end   = data.haystack.length - 1;

        const needleToSearch = Number(data.needle);

        while (start <= end) {
            const mid = Math.floor((start + end) / 2);
            const midKey = Number(data.haystack[mid][data.key]);

            if (midKey === needleToSearch) {
                return data.haystack[mid];
            }

            if (needleToSearch < midKey) {
                end = mid - 1;
            } else {
                start = mid + 1;
            }
        }
        return undefined;
    }, []);

    return {
        binarySearch
    }
}