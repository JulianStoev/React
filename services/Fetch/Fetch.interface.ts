export type FetchMethod = 'POST' | 'PUT' | 'GET' | 'PATCH' | 'HEAD' | 'OPTIONS' | 'DELETE';

export interface FetchRequestInterface {
    urlencoded?: boolean; // used for file uploads and formData, defaults to json
    data?: {[name: string]: any | string}; // data object to be send to the backend
    uri: string;
}

export interface AjaxErrorResponse<bodyType> {
    status: number;
    statusText: string;
    body: bodyType;
}