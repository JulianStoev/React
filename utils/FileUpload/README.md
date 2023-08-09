# React File upload hook
Simple hook to use the Fetch API in react for ajax calls. Supports chunked upload.

## Sample Usage
```
const { uploadInit, onFile } = useFileUpload();
```

```
uploadInit({
    url: '/file-upload-url',
    chunkSize: 500000,
    instantUpload: false,
    id: 'temp_' + Math.floor(Math.random() * 1000),
    // upload started
    onStart: (e) => {
        console.log('start', e);
    },
    // percent loaded
    onProgress: (e) => {
        console.log('progress', e);
        setProgress(e);
    },
    // aborted
    onAbort: (e) => {
        console.log('abort', e);
        setProgress(0);
    },
    // an error occured
    onError: (e) => {
        console.log('error', e);
        setProgress(0);
    },
    // everything is uploaded
    onDone: () => {
        console.log('all files uploaded');
        setProgress(0);
    },
    // a file was uploaded or removed
    onChange: (formDataArr) => {
        formDataArr.forEach(fd => {
            console.log(fd.get('image'));
        });
    }
});
```

  
```
<input type="file" onChange={ onFile }  />
```
