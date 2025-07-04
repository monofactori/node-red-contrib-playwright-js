# class: Video
* since: v1.8

When browser context is created with the `recordVideo` option, each page has a video object associated with it.

```js
console.log(await page.video().path());
```

## async method: Video.delete
* since: v1.11

Deletes the video file. Will wait for the video to finish if necessary.

## async method: Video.path
* since: v1.8
- returns: <[path]>

Returns the file system path this video will be recorded to. The video is guaranteed to be written to the filesystem
upon closing the browser context. This method throws when connected remotely.

## async method: Video.saveAs
* since: v1.11

Saves the video to a user-specified path. It is safe to call this method while the video
is still in progress, or after the page has closed. This method waits until the page is closed and the video is fully saved.

### param: Video.saveAs.path
* since: v1.11
- `path` <[path]>

Path where the video should be saved.
