# MySQL Connector/Node.js

MySQL Connector/Node.js is a connector for the asynchronous Node.js platform in
version 4.2 written in 100% JavaScript speaking the X DevAPI Protocol (no support for the traditional MySQL protocol).

## Requirements:

 * MySQL 8.0.3 or higher
 * Node.js 4.2 or higher

## Installation:

The Node.js runtime follows a specific structure where packages are put in a
[`node_modules`](https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders)
directory from which they can be loaded. This can be done with the `npm` tool from your
project's directory:

```sh
$ npm install mysql-connector-nodejs-8.0.9.tar.gz
```

You can also fetch the Connector directly from npmjs.com:

```sh
$ npm install @mysql/xdevapi
```

## Getting started:

The upper userspace layer which will follow the X DevAPI. This follows quite
closely to what other X enabled connectors should do, but there is an important
difference: This connector is asynchronous and returns Promises for all network
operations. Check the [`Promise` reference documentation](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise) for more details.

Let's take a look at a sample script to understand the asynchronous
behavior and some common pitfalls:

```js
"use strict";

const xdevapi = require('@mysql/xdevapi');

xdevapi.getSession({
    host: 'localhost',
    port: 33060,
    dbUser: 'root',
    dbPassword: ''
}).then(function (session) {
    console.log("connected");
    return session.createSchema("foo").then(function (schema) {
        return schema.createCollection("bar");
    }).then(function (collection) {
        return Promise.all([
            collection.add(
                { baz: { foo: "bar"} },
                { baz: { foo: "baz"} },
                { baz: { foo: "baz"} },
                { address: { street: "221b Main St"} }
            ).execute(),
            collection.find("@.baz.foo == 'baz'").execute( row => console.log(row) ),
            collection.drop().execute()
        ]);
    }).then(function () {
        return session.dropSchema("foo");
    }).then(function () {
        return session.getSchemas();
    }).then(function (schemas) {
        console.log(schemas);
        return session.close();
    });
}).catch(function (err) {
    console.log(err.stack);
});
console.log("Hello World");
```

If this is placed under the name `test.js` into the `my_test_directory` we
create in the instructions above you should be able to run it using
`node test.js`.

This script starts with a marker to enable the [`strict` mode](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode), so that
variables have to be declared and some other things.

Then we load the `xdevapi` [module](https://nodejs.org/api/modules.html).

Then it becomes interesting

```js
xdevapi.getSession({
    host: 'localhost',
    port: 33060,
    dbUser: 'root',
    dbPassword: ''
}).then(function (session) {
    console.log("connected");
}).catch(function (err) {
    console.log(err.stack);
});
console.log("Hello World");
```

`getSession()` is a function from the xdevapi module taking an object with
properties as parameter. `33060` is the port that the X Protocol uses by default.
The return value is a Promise which will resolve to a Session object.
This means that as soon as we're successfully connected the callback
provided to the `then()` function will be called. In case of an error the
exception provided to `catch()` will be called. Mind that the execution
won't block but those callbacks are called sometime later. Therefore
we're seeing `"Hello world"` printed before `"connected"`.

One important thing is that by this async nature it is easy to "lose"
errors. For instance, when running this code:

```js
xdevapi.getSession({
    host: 'localhost',
    port: 33060,
    dbUser: 'root',
    dbPassword: ''
}).then(function (session) {
    session.createSchema("mysql").then(function (schema) {
        // never reached as a schema "mysql" already exists
        console.log("schema mysql created");
        session.close();
    });
}).catch(function (err) {
    console.log(err.stack);
});
```

We won't see any output and the script will hang. The reason is that the
error happens in an async part of the code and is never caught.
Additionally we only close the connection if this was successful, but as
long as a network connection exists node.js doesn't terminate.

We have a few ways to fix this. One approach might be like this:

```js
}).then(function (session) {
    session.createSchema("mysql").then(function (schema) {
        // never reached as a schema "mysql" already exists
        console.log("schema mysql created");
    }).catch(function (err) {
        console.log(err.stack);
    });
    session.close();
}).catch(function (err) {
```

Here we'll send the close directly after the create schema, even before
we received the response from create schema, essentially the close will
be pipelined by the server. Additionally we're handling the error.
Another approach, which is taken in the large script above is returning
the promise returned by `createSchema()` to `getSession()`'s `then()` which
will in turn trigger the outer catch block.

Another technique I'm using in the script above is using Promise.all to
group operations.

```js
return Promise.all([
    collection.add(
        {_id: 1232321, baz: { foo: "bar"}},
        {_id: 2256521, baz: { foo: "baz"}},
        {_id: 3256521, baz: { foo: "baz"}},
        {_id: 4256521, address: { street: "221b Main St"}}
    ).execute(),
    collection.find("@.baz.foo == 'baz'").execute(function (row) { console.log(row); }),
    collection.drop()
]);
```

Here three operations operations will be sent to the server (`add`, `find`
and `drop`) and a common Promise will be returned. Here it is important
that all operations will be executed even if an earlier one fails. I.e.
if `add()` fails due to duplicate keys or similar the `find` will still be
executed on the server, as will `drop()`. The only purpose
of grouping the Promises this way is to report an error up. To prevent
later operations we'd have to chain the Promises up.

```js
    }).then(function () {
        return collection.add(
            {_id: 1232321, baz: { foo: "bar"}},
            {_id: 2256521, baz: { foo: "baz"}},
            {_id: 3256521, baz: { foo: "baz"}},
            {_id: 4256521, address: { street: "221b Main St"}}
        ).execute();
    }).then(function () {
        return collection.find("@.baz.foo == 'baz'").execute(function (row) { console.log(row); }),
    }).then(function () {
        return collection.drop()
    }).then(function () {
```

Downsides of this approach are that we have to somehow provide the
collection object to all of those scopes and we have less throughput as
the following operation will only be sent to the server after we
processed the response from the previous operation (no pipelining). A
future version of the connector may provide "batches". Additionally, one has
to be careful to put the `return` statements in, else errors will be
lost, again.


## FAQ
### SSL/TLS

In order to enable SSL you have to configure the server accordingly and then
set the ssl option to true.

```js
var sessionPromise = xdevapi.getSession({
    host: 'localhost',
    port: 33060,
    dbUser: 'root',
    dbPassword: '',
    ssl: true
});
```

Via the [`sslOptions` property]{@link Properties} you can set additional
SSL options from [your platform](https://nodejs.org/api/tls.html#tls_new_tls_tlssocket_socket_options).

Currently, there is out-of-the-box support for validating a server certificate against a CA (Certificate Authority) and/or a CRL (Certificate Revocation List), so in that case, you just need to provide the path to the respective [PEM-encoded X.509](https://tools.ietf.org/html/rfc5280) files like so:

```js
var sessionPromise = xdevapi.getSession({
    host: 'localhost',
    port: 33060,
    dbUser: 'root',
    dbPassword: '',
    ssl: true,
    sslOptions: {
        ca: 'path/to/ca.pem',
        crl: 'path/to/crl.pem'
    }
});
```

### Authentication

By default the `MYSQL41` password mechanism is used. The connector also supports
`PLAIN` password transfer (only when using SSL)

```js
var sessionPromise = xdevapi.getSession({
    host: 'localhost',
    port: 33060,
    dbUser: 'root',
    dbPassword: '',
    ssl: true,
    authMethod: 'PLAIN'
});
```
By implementing the {@link IAuthenticator} interface a user can also provide custom
authentication mechanisms.

### URIs and connection strings

Besides creating sessions with a configuration object, one can also resort to a traditional [RFC 3986](https://tools.ietf.org/html/rfc3986) URI or even a simplified connection string (by just dropping the scheme).

```js
// RFC 3986
var sessionPromise = xdevapi.getSession('mysqlx://root@localhost:33060');

// Simplified connection strings
var sessionPromise = xdevapi.getSession('root@localhost:33060');
```

### Local sockets (UNIX-only)

Besides using TCP-based connections, you can also connect to a local server via a UNIX socket:

```js
// pct-encoded socket path
var sessionPromise = xdevapi.getNodeSession('mysqlx://root@%2Fpath%2Fto%2Fsocket/schema');

// unencoded socket path
var sessionPromise = xdevapi.getNodeSession('mysqlx://root@(/path/to/socket)/schema');
```

### Failover

You can provide multiple MySQL router or server addresses (host and port) when creating a session. This allows the connector to perform automatic failover selection when the hosts are not available. The selection is made based on the priority assigned to each address, either implicitely (position in the list), or explicitely (using a special format depicted above).

Explicit priorities should start at `0` (lowest priority) and finish at `100` (highest priority). When two addresses share the same priority, the first one from the list will be selected.

```js
// Implicit priority (ordered list of addresses)
var sessionPromise = xdevapi.getSession('mysqlx://root@[localhost:33060, 127.0.0.1:33060]');

// Explicit priority
var sessionPromise = xdevapi.getSession('mysqlx://root@[(address=127.0.0.1:33060, priority=99), (address=localhost:33060, priority=100)]');
```

### Script hangs

If you run a custom script and it hangs most likely you didn't close your
session using [`session.close()`]{@link Session#close} as Node.js doesn't
terminate a script as long as a connection is open. This is often caused by an
error which wasn't handled properly. Check your script for code paths where
a `Promise` has no `catch` routine defined or where no `close` happens
afterwards.
