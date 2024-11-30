import { useCallback, useEffect, useState } from "react";
import { FileUploadDataInterface } from "./FileUpload.interface";

export default function useFileUpload() {

    const [ files, setFiles ] = useState<FormData[]>([]);
    const [ data, setData ] = useState({} as FileUploadDataInterface);
    const [ startUpload, setStartUpload ] = useState(false);
    const [ response, setResponse ] = useState(null as any);

    const removeFile = useCallback((index: number): void => {
        setFiles(oldState => ([
            ...oldState.filter((_file, i) => i !== index)
        ]));
    }, []);

    const removeAllFiles = useCallback((): void => {
        setFiles([])
    }, []);

    const uploadInit = useCallback((uploadData: FileUploadDataInterface): void => {
        setData(uploadData);
    }, []);

    const countFiles = useCallback((): number => {
        return files.length;
    }, [ files ]);

    const addFileData = useCallback((fileData: FileUploadDataInterface): void => {
        files.forEach(file => {
            for (const [key, val] of Object.entries(fileData)) {
                file.append(key, val);
            }
        });
    }, [ files ]);

    function setDataset(dataset: DOMStringMap, formData: FormData): void {
        if (Object.keys(dataset)[0] !== undefined) {
            for (const [key, val] of Object.entries(dataset)) {
                formData.append(key, val || '');
            }
        }
    }

    const onFile = (event: React.SyntheticEvent<HTMLInputElement>): void => {
        const fileList: File[] = Array.from((event.target as HTMLFormElement).files);
        if (!fileList[0]) return;

        const id = (event.target as HTMLFormElement).id;
        const dataset = (event.target as HTMLFormElement).dataset;
        const filesToAdd: FormData[] = [];
        let newData = {...data};

        fileList.forEach(file => {
            const filesize = file.size;

            // prevents the GIF image to be send on chunks
            if (file.type === 'image/gif') {
                newData = {
                    ...data,
                    chunkSize: 0
                }
            }
            
            if (!newData.chunkSize || newData.chunkSize >= filesize) {
                const formData = new FormData();
                if (id) {
                    formData.append('id', id);
                }
                formData.append('image', file, file.name);
                formData.append('file_name', file.name);
                setDataset(dataset, formData);
                filesToAdd.push(formData);
            } else {
                const count = Math.ceil(filesize / newData.chunkSize);
                let start = 0;
                let end = Math.ceil(filesize / count);
                for (let i = 1; i <= count; i++) {
                    const chunk = new FormData();
                    if (id) {
                        chunk.append('id', id);
                    }
                    setDataset(dataset, chunk);
                    chunk.append('file_name', file.name);
                    chunk.append('chunked', '1');
                    chunk.append('parts', count + '');
                    chunk.append('part', i + '');
                    chunk.append('chunk_' + i, file.slice(start, end), 'chunk_' + i);
                    start = end;
                    end += Math.ceil(filesize / count);
                    if (filesize < end) {
                        end = filesize;
                    }
                    filesToAdd.push(chunk);
                }
            }
        });
        setFiles(oldState => ([...oldState, ...filesToAdd]));
    };

    // const doneFn = useCallback((json: any): void => {
    //     if (!json) {
    //         alert('There was no response from the server');
    //         return;
    //     }
    //     if (json.success === 0) {
    //         console.error('[Upload error]: ' + json.message);
    //         return;
    //     }
    //     if (typeof data.onDone == 'function') {
    //         data.onDone(json);
    //     }
    // }, [ data ]);

    const XHRUpload = useCallback((file: FormData) => {
        const xhr = new XMLHttpRequest();
  
        if (data.onProgress) xhr.upload.onprogress = e => e.lengthComputable && data.onProgress ? data.onProgress(Math.round((e.loaded / e.total) * 100)) : 0;
  
        if (data.onError) xhr.upload.onerror = e => data.onError ? data.onError(e) : '';
  
        if (data.onStart) xhr.onloadstart = e => data.onStart ? (e) : '';
  
        if (data.onAbort) xhr.upload.onabort = e => data.onAbort ? (e) : '';
  
        xhr.onload = e => {
            if (xhr.readyState === 4 && xhr.status === 200) {
                let json;
                try {
                    json = JSON.parse(xhr.responseText);
                } catch (e) {
                    json = { success: 0, message: xhr.responseText };
                }
                setResponse(json);
                // remove the file we've just uploaded so the effect can call the next one
                setFiles(currentFiles => {
                    return currentFiles.filter(f => {
                        const chunked = f.get('chunked');
                        if (chunked !== null) {
                            return !(f.get('file_name') === file.get('file_name') && f.get('part') === file.get('part'));
                        }
                        return f.get('file_name') !== file.get('file_name');
                    });
                });
                return;
            }
            if (typeof data.onError == 'function') {
                data.onError(e);
            }
        };

        xhr.open('POST', data.url);
        // add your authentication headers here
        if (data.headers) {
            for (const [headerName, headerVal] of Object.entries(data.headers)) {
                xhr.setRequestHeader(headerName, headerVal);
            }
        }
        xhr.send(file);
    }, [ data ]);

    // the user called the upload process
    const upload = useCallback((): void => {
        setStartUpload(true);
    }, []);

    // if instant upload is selected upload when there are files
    useEffect(() => {
        if (data.instantUpload && files[0] !== undefined) {
            upload();
        }
    }, [ data.instantUpload, files, upload ]);

    // if we have startUpload and any files we start uploading
    useEffect(() => {
        if (startUpload === false) return;
        if (files[0] === undefined) {
            setStartUpload(false);
            return;
        }
        // const images = files; // avoid the setstate async
        // if (!images[0]) return;
        // XHRUpload(images[0]);
        XHRUpload(files[0]);
    }, [ startUpload, files, XHRUpload, data ]);

    // if we have startUpload and any files we start uploading
    useEffect(() => {
        if (files[0] === undefined && response && typeof data.onDone == 'function') {
            data.onDone(response);
            setResponse(null);
        }      
    }, [ files, data, response ]);

    useEffect(() => {
        if (typeof data.onChange == 'function') {
            data.onChange([...files]);
        }
    }, [ files, data ]);

    return {
        uploadInit,
        removeFile,
        removeAllFiles,
        countFiles,
        addFileData,
        onFile,
        upload
    }

}
