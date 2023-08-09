import { useCallback, useEffect, useState } from "react";
import { FileUploadDataInterface } from "./FileUpload.interface";

export default function useFileUpload() {

    const [ files, setFiles ] = useState<FormData[]>([]);
    const [ data, setData ] = useState({} as FileUploadDataInterface);
    const [ startUpload, setStartUpload ] = useState(false);

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

    const onFile = (event: React.SyntheticEvent<HTMLInputElement>): void => {
        const fileList: File[] = Array.from((event.target as HTMLFormElement).files);
        if (!fileList[0]) return;

        const filesToAdd: FormData[] = [];

        fileList.forEach(file => {
            const filesize = file.size;   
 
            if (!data.chunkSize || data.chunkSize >= filesize) {
                const formData = new FormData();
                if (data.id) {
                    formData.append('id', data.id.toString());
                }
                formData.append('image', file, file.name);
                filesToAdd.push(formData);
            } else {
                const count = Math.ceil(filesize / data.chunkSize);
                let start = 0;
                let end = Math.ceil(filesize / count);
                for (let i = 1; i <= count; i++) {
                    const chunk = new FormData();
                    if (data.id) {
                        chunk.append('id', data.id.toString());
                    }
                    chunk.append('chunked', '1');
                    chunk.append('parts', count.toString());
                    chunk.append('part', i.toString());
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
                // let json;
                // try {
                //     json = JSON.parse(xhr.responseText);
                // } catch (e) {
                //     json = { success: 0, message: xhr.responseText };
                // }

                // remove the file we've just uploaded so the effect can call the next one
                setFiles(currentFiles => {
                    return currentFiles.filter(f => {
                        return f.get('image') === file.get('image');
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
            Object.keys(data.headers).forEach(key => xhr.setRequestHeader(key, data.headers[key]));
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
            if (typeof data.onDone == 'function') {
                data.onDone();
            }
            return;
        }
        XHRUpload(files[0]);
    }, [ startUpload, files, XHRUpload, data ]);

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