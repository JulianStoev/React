export interface FileUploadDataInterface {
    chunkSize?: number;
    instantUpload?: boolean;
    url: string;
    headers?: {
        [key: string]: string
    };
    onStart?: (arg0: ProgressEvent<EventTarget>) => void;
    onProgress?: (arg0: number) => void;
    onAbort?: (arg0: ProgressEvent<EventTarget>) => void;
    onError?: (arg0: ProgressEvent<EventTarget>) => void;
    onDone?: (arg0: any) => void;
    onChange?: (files: FormData[]) => void;
}
