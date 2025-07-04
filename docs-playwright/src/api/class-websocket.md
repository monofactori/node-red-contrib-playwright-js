# class: WebSocket
* since: v1.8

The [WebSocket] class represents WebSocket connections within a page. It provides the ability to inspect and manipulate the data being transmitted and received.

If you want to intercept or modify WebSocket frames, consider using [WebSocketRoute].

## event: WebSocket.close
* since: v1.8
- argument: <[WebSocket]>

Fired when the websocket closes.

## event: WebSocket.frameReceived
* since: v1.9
- argument: <[Object]>
  - `payload` <[string]|[Buffer]> frame payload

Fired when the websocket receives a frame.

## event: WebSocket.frameSent
* since: v1.9
- argument: <[Object]>
  - `payload` <[string]|[Buffer]> frame payload

Fired when the websocket sends a frame.

## event: WebSocket.socketError
* since: v1.9
- argument: <[string]>

Fired when the websocket has an error.

## method: WebSocket.isClosed
* since: v1.8
- returns: <[boolean]>

Indicates that the web socket has been closed.

## method: WebSocket.url
* since: v1.8
- returns: <[string]>

Contains the URL of the WebSocket.

## async method: WebSocket.waitForEvent
* since: v1.8
* langs: js
- returns: <[any]>

Waits for event to fire and passes its value into the predicate function. Returns when the predicate returns truthy
value. Will throw an error if the webSocket is closed before the event is fired. Returns the event data value.
