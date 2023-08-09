// React Fetch Hook v1.3
// https://github.com/JulianStoev

import { useCallback } from "react";
import { FetchMethod, FetchRequestInterface } from "./Fetch.interface";

export function useFetch() {

    const buildUrl = useCallback((data: FetchRequestInterface, method: FetchMethod): string => {
        // build your URL with env if needed
        const url = API_URL;

        if (data.data && method === 'GET') {
            data.uri += '?' + new URLSearchParams(data.data);
        }
        return url + data.uri;
    }, []);

    const buildSendData = useCallback((data: FetchRequestInterface, method: FetchMethod): RequestInit => {
        const toSend: RequestInit = {
            method: method,
            mode: 'cors',
            body: undefined,
            // use interceptor for more headers
            headers: new Headers({
                'Content-Type': (data.urlencoded ? 'application/x-www-form-urlencoded' : 'application/json')
            })
        };

        if (data.data && method !== 'GET') {
            toSend.body = JSON.stringify(data.data);
        }

        return toSend;
    }, []);

    const buildError = useCallback(async (err: any): Promise<any> => {
        const response = {
            status: 0,
            statusText: '',
            body: err
        };

        if (err instanceof Response) {
            let body = await err.text();
            try {
                // safely check if valid json
                body = JSON.parse(body);
            } catch(err) {
                console.error('[Parsing request error', err);
            }
            response.status = err.status;
            response.statusText = err.statusText;
            response.body = body;
        }

        return response;
    }, []);

    const startRequest = useCallback((data: FetchRequestInterface, method: FetchMethod): Promise<any> => {
        const url = buildUrl(data, method);

        return new Promise((resolve, reject) => {

            const fetchFn = async (): Promise<void> => {
                // start the request
                try {
                    await fetch(url, buildSendData(data, method))
                        .then(response => response.ok ? response.text() : Promise.reject(response))
                        .then(response => {
                            // convert the response to text first to avoid error in case of no response when parsing directly to json
                            const json = (response ? JSON.parse(response) : {});
                            resolve(json);
                        });
                } catch(err: any) {
                    const response = await buildError(err);
                    reject(response);
                }
            };

            fetchFn();

        });
    }, [buildUrl, buildSendData, buildError]);

    const post      = useCallback((data: FetchRequestInterface) => startRequest(data, 'POST'), [startRequest]);
    const put       = useCallback((data: FetchRequestInterface) => startRequest(data, 'PUT'), [startRequest]);
    const get       = useCallback((data: FetchRequestInterface) => startRequest(data, 'GET'), [startRequest]);
    const patch     = useCallback((data: FetchRequestInterface) => startRequest(data, 'PATCH'), [startRequest]);
    const head      = useCallback((data: FetchRequestInterface) => startRequest(data, 'HEAD'), [startRequest]);
    const options   = useCallback((data: FetchRequestInterface) => startRequest(data, 'OPTIONS'), [startRequest]);
    const del       = useCallback((data: FetchRequestInterface) => startRequest(data, 'DELETE'), [startRequest]);

    return {
        post,
        put,
        get,
        patch,
        head,
        options,
        del
    }
}