# Connector/Node.JS

Connector/NJS is a connector for the asynchronous Node.JS platform in
version 4.2 written in 100% JavaScript speaking the X DevAPI Protocol.
(no support for the traditional MySQL protocol)

## Requirements:

 * MySQL 5.7.12 or higher, with the X plugin enabled
 * Node.JS 4.2

## Putting c/NJS in place:

The Node.JS runtime follows a specific structure where packages are put in a
[https://nodejs.org/api/modules.html#modules_loading_from_node_modules_folders](node_modules)
directory from which they can be loaded. This can be done with the `npm` tool from your
project's directory:

```
    $ npm install mysql-connector-nodejs-1.0.2.tar.gz
```

## Getting started:

The upper userspace layer which will follow the X DevAPI. This follows quite 
closely to what other X enabled connectors should do, but there is an important
difference: This connector is asynchronous and returns Promises for all network
operations. See
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise for basic introduction to JavaScript's Promise.

Let's take a look at a sample script to understand the asynchronous
behavior and some common pitfalls:

```
"use strict";

const mysqlx = require('mysqlx');

mysqlx.getSession({
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
If this is placed under the name test.js into the my_test_directory we
create in the instructions above you should be able to run it using
`node test.js`.


This script starts with a marker to enable the "strict" mode, so that
variables have to be declared and some other things.
https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Strict_mode

Then we load the mysqlx module. As we've put the code into
node_modules/mysqlx node.js's module loader will work.
https://nodejs.org/api/modules.html

Then it becomes interesting

```
mysqlx.getSession({
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

getSession is a function from the mysqlx module taking an object with
properties as parameter. 33060 is the port that the X DevAPI Protocol uses by default.
The return value is a Promise which will resolve to a Session object.
This means that as soon as we're successfully connected the callback
provided to the then() function will be called. In case of an error the
exception provided to catch() will be called. Mind that the execution
won't block but those callbaks are called sometime later. Therefore
we're seeing "Hello world" printed before "connected". 

One important thing is that by this async nature it is easy to "lose"
errors. For instance, when running this code:

```
mysqlx.getSession({
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

```
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
the promise returned by createSchema() to getSession()'s then() which
will in turn trigger the outer catch block. 

Another technique I'm using in the script above is using Promise.all to
group operations.

```
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

Here three operations operations will be sent to the server (add, find
and drop) and a common Promise will be returned. Here it is important
that all operations will be executed even if an earlier one fails. I.e.
if add() fails due to duplicate keys or similar the find will still be
executed on the server, as will the collection.drop(). The only purpose
of grouping the Promises this way is to report an error up. To prevent
later operations we'd have to chain the Promises up.

```
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
to be careful to put the "return" statements in, else errors will be
lost, again.


## FAQ 
### SSL/TLS

In order to enable SSL you have to configure the server accordingly and then
set the ssl option to true. 

```
var sessionPromise = mysqlx.getNodeSession({
    host: 'localhost',
    port: 33060,
    dbUser: 'root',
    dbPassword: '',
    ssl: true
});
```

Via the [sslOptions property]{@link Properties} you can set additional
SSL options from [your platform](https://nodejs.org/api/tls.html#tls_new_tls_tlssocket_socket_options).

### Authentication

By default the MySQL41 password mechanism is used. The connector also supports
PLAIN password transfer (only when using SSL)

```
var sessionPromise = mysqlx.getNodeSession({
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

### Script hangs

If you run a custom script and it hangs most likely you didn't close your
session using [session.close()]{@link BaseSession#close} as Node.JS doesn't
terminate a script as long as a connection is open. This is often caused by an
error which wasn't handled properly. Check your script for code paths where
a `Promise` has no `catch` routine defined or where no `close` happens
afterwards.
