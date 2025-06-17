'use strict';

// Enhanced mock implementation of node-fetch
const nodeFetch = jest.fn(() =>
  Promise.resolve({
    json: () => Promise.resolve({}),
    text: () => Promise.resolve(''),
    blob: () =>
      Promise.resolve({
        arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
        size: 0,
        type: 'application/octet-stream',
      }),
    arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    formData: () => Promise.resolve({}),
    buffer: () => Promise.resolve(Buffer.from('')),
    ok: true,
    status: 200,
    statusText: 'OK',
    headers: new Headers(),
    clone: () => nodeFetch(),
  }),
);

// Create Headers class
class Headers {
  constructor(init) {
    this.headers = {};
    if (init) {
      Object.entries(init).forEach(([key, value]) => {
        this.set(key, value);
      });
    }
  }

  get(name) {
    return this.headers[name.toLowerCase()] || null;
  }
  set(name, value) {
    this.headers[name.toLowerCase()] = value;
  }
  append(name, value) {
    this.headers[name.toLowerCase()] = value;
  }
  delete(name) {
    delete this.headers[name.toLowerCase()];
  }
  has(name) {
    return name.toLowerCase() in this.headers;
  }
  forEach(callback) {
    Object.entries(this.headers).forEach(([k, v]) => callback(v, k, this));
  }
}

// Create Response class
class Response {
  constructor(body, init = {}) {
    this.body = body || '';
    this.status = init.status || 200;
    this.statusText = init.statusText || '';
    this.headers = new Headers(init.headers);
    this.ok = this.status >= 200 && this.status < 300;
  }

  json() {
    return Promise.resolve(
      typeof this.body === 'string' ? JSON.parse(this.body) : this.body,
    );
  }
  text() {
    return Promise.resolve(String(this.body));
  }
  arrayBuffer() {
    return Promise.resolve(new ArrayBuffer(0));
  }
  blob() {
    return Promise.resolve({
      arrayBuffer: () => Promise.resolve(new ArrayBuffer(0)),
    });
  }
}

// Create Request class
class Request {
  constructor(url, init = {}) {
    this.url = url;
    this.method = init.method || 'GET';
    this.headers = new Headers(init.headers);
    this.body = init.body || null;
  }
}

// Assign classes to fetch function
nodeFetch.Headers = Headers;
nodeFetch.Response = Response;
nodeFetch.Request = Request;

// Make it work with both require and import
module.exports = nodeFetch;
module.exports.default = nodeFetch;
