# class: APIResponse
* since: v1.16

[APIResponse] class represents responses returned by [`method: APIRequestContext.get`] and similar methods.

## async method: APIResponse.body
* since: v1.16
- returns: <[Buffer]>

Returns the buffer with response body.

## async method: APIResponse.dispose
* since: v1.16

Disposes the body of this response. If not called then the body will stay in memory until the context closes.

## method: APIResponse.headers
* since: v1.16
- returns: <[Object]<[string], [string]>>

An object with all the response HTTP headers associated with this response.

## method: APIResponse.headersArray
* since: v1.16
- returns: <[Array]<[Object]>>
  - `name` <[string]> Name of the header.
  - `value` <[string]> Value of the header.

An array with all the response HTTP headers associated with this response. Header names are not lower-cased.
Headers with multiple entries, such as `Set-Cookie`, appear in the array multiple times.

## async method: APIResponse.json
* since: v1.16
* langs: js
- returns: <[Serializable]>

Returns the JSON representation of response body.

This method will throw if the response body is not parsable via `JSON.parse`.

## method: APIResponse.ok
* since: v1.16
- returns: <[boolean]>

Contains a boolean stating whether the response was successful (status in the range 200-299) or not.

## method: APIResponse.status
* since: v1.16
- returns: <[int]>

Contains the status code of the response (e.g., 200 for a success).

## method: APIResponse.statusText
* since: v1.16
- returns: <[string]>

Contains the status text of the response (e.g. usually an "OK" for a success).

## async method: APIResponse.text
* since: v1.16
- returns: <[string]>

Returns the text representation of response body.

## method: APIResponse.url
* since: v1.16
- returns: <[string]>

Contains the URL of the response.
