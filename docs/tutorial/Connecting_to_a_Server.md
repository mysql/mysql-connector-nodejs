You can establish a connection with a MySQL server by creating a `Session` through the `getSession()` method available in the main module API. The session will be established via the [X Plugin](https://dev.mysql.com/doc/refman/8.0/en/x-plugin.html) which, by default, listens on TCP port `33060`. Also, by default, X Protocol sessions are established using TLS and the `PLAIN` authentication method (more details available [here]{@tutorial Secure_Sessions}). You can resort to any of the following flavours to create a new session.

Using a standard [RFC 3986](https://tools.ietf.org/html/rfc3986) URI:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root:passwd@localhost:33060/mySchema')
    .then(session => {
        console.log(session.inspect()); // { user: 'root', host: 'localhost', port: 33060 }
    });
```

Using a "unified" connection string, which is basically a reduced version of the RFC 3986 URI (without the _scheme_):

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('root:passwd@localhost:33060/mySchema')
    .then(session => {
        console.log(session.inspect()); // { user: 'root', host: 'localhost', port: 33060 }
    });
```

Using a session configuration object:

```js
const mysqlx = require('@mysql/xdevapi');

const config = {
    password: 'passwd',
    user: 'root',
    host: 'localhost',
    port: 33060,
    schema: 'mySchema'
};

mysqlx.getSession(config)
    .then(session => {
        console.log(session.inspect()); // { user: 'root', host: 'localhost', port: 33060 }
    });
```

If the server is running in the same machine as the client, and is bound to a local UNIX socket (no support for windows pipes yet), the previous examples work, with some small notation differences.

Using a standard [RFC 3986](https://tools.ietf.org/html/rfc3986) URI with a pct-encoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root:passwd@%2Fpath%2Fto%2Fsocket/mySchema')
    .then(session => {
        console.log(session.inspect()); // { user: 'root', socket: '/path/to/socket' }
    });
```

Using a standard [RFC 3986](https://tools.ietf.org/html/rfc3986) URI with an unencoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root:passwd@(/path/to/socket)/mySchema')
    .then(session => {
        console.log(session.inspect()); // { user: 'root', socket: '/path/to/socket' }
    });
```

Using a "unified" connection string with a pct-encoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('root:passwd@%2Fpath%2Fto%2Fsocket/mySchema')
    .then(session => {
        console.log(session.inspect()); // { user: 'root', socket: '/path/to/socket' }
    });
```

Using a "unified" connection string with an unencoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('root:passwd@(/path/to/socket)/mySchema')
    .then(session => {
        console.log(session.inspect()); // { user: 'root', socket: '/path/to/socket' }
    });
```

Using a session configuration object:

```js
const mysqlx = require('@mysql/xdevapi');

const config = {
    password: 'passwd',
    user: 'root',
    socket: '/path/to/socket',
    schema: 'mySchema'
};

mysqlx.getSession(config)
    .then(session => {
        console.log(session.inspect()); // { user: 'root', socket: '/path/to/socket' }
    });
```

### Multi-host and failover

You can provide multiple MySQL router or server endpoints (host and/or port or unix sockets) when creating a session. This allows the connector to perform automatic failover selection when the endpoints are not available. The selection is made based on the priority specified for each endpoint or randomly if the priority is not speficied.

Explicit priorities should start at `0` (lowest priority) and finish at `100` (highest priority). When two endpoints share the same priority, one of them will be picked randomly.

> **WARNING**
>
> In previous versions of Connector/Node.js, endpoints would be assigned an implicit descending priority according to their position on the list. This is no longer the case.

When, setting up multihost failover endpoints without priority, any of the available endpoints can be picked:

```js
const mysqlx = require('@mysql/xdevapi');

const uri = 'mysqlx://root:passwd@[127.0.0.1:33060, 127.0.0.1:33061, 127.0.0.1:33062]';
// or
const options = {
    endpoints: [{
        host: '127.0.0.1',
        port: 33060
    }, {
        host: '127.0.0.1',
        port: 33061
    }, {
        host: '127.0.0.1',
        port: 33062
    }],
    user: 'root',
    password: 'passwd'
};

// if neither 33060 nor 33061 are available
mysqlx.getSession(uri)
    .then(session => {
        console.log(session.inspect().port); // 33062
    });

// if neither 33060 nor 33062 are available
mysqlx.getSession(uri)
    .then(session => {
        console.log(session.inspect().port); // 33061
    });

// if neither 33061 nor 33062 are available
mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().port); // 33061
    });

// if only 33060 is not available, any of the other two can be picked
mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().port); // 33061 or 33062
    })
```

Setting-up failover servers with explicit priority:

```js
const mysqlx = require('@mysql/xdevapi');

const uri = 'mysqlx://root:passwd@[(address=127.0.0.1:33060,priority=99),(address=127.0.0.1:33061,priority=100)]';
// or
const options = {
    endpoints: [{
        host: '127.0.0.1',
        port: 33060,
        priority: 99
    }, {
        host: '127.0.0.1',
        port: 33061,
        priority: 100
    }]
};

// if both endpoints are available
mysqlx.getSession(uri)
    .then(session => {
        console.log(session.inspect().port); // 33061
    });

// if 33061 is not available
mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().port); // 33060
    });
```

Mixing endpoints with and without priority is not possible with a connection string. It is possible to do it using a configuration object but it is not avised. In case it happens, endpoints without priority will be randomly picked only and if only there are no endpoints with a specific priority which are available at the moment.

```js
const mysqxl = require('@mysql/xdevapi');
const options = {
    endpoints: [{
        host: '127.0.0.1',
        port: 33060
    }, {
        host: '127.0.0.1',
        port: 33061,
        priority: 90
    }, {
        host: '127.0.0.1',
        port: 33062
    }, {
        host: '127.0.0.1',
        port: 33063,
        priority: 100
    }],
    user: 'root',
    password: 'passwd',
};

// if all endpoints are available
mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().port); // 33063
    });

// if 33063 is not available
mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().port) // 33061
    });

// if neither 33063 nor 33061 are available any of the either two can be picked
mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().port) // 33060 or 33062
    });
```

### Connection timeout

By default, the initial server connection will timeout after 10 seconds in a single-host scenario, and after 10 seconds for each connection attempt in a multi-host scenario. You can override this behavior by providing a custom timeout value, which should be an integer representing the number of `ms` to wait for a valid connection.

In a single-host scenario, when a connection is not established in the defined interval, the following should happen:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root:passwd@localhost:33060?connect-timeout=5000')
    .catch(err => {
        // connection could not be established after 5 seconds
        console.log(err.message); // Connection attempt to the server was aborted. Timeout of 5000 ms was exceeded.
    });
```

As usual you can also set a custom value using a plain JavaScript object, whose counterpart property name is, in this case, `connectTimeout`.

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession({ user: 'root', password: 'passwd', connectTimeout: 8000 })
    .catch(err => {
        // connection could not be established after 8 seconds
        console.log(err.message); // Connection attempt to the server was aborted. Timeout of 8000 ms was exceeded.
    });
```

In a multi-host scenario, the error message will be a bit different:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root:passwd@[localhost:33060, 127.0.0.1:33060]?connect-timeout=5000')
    .catch(err => {
        // connection could not be established after 10 seconds (5 seconds for each server)
        console.log(err.message); // All server connection attempts were aborted. Timeout of 5000 ms was exceeded for each selected server.
    });
```

To explicitly disable the timeout, you can use `connect-timeout=0`.

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root:passwd@127.0.0.1:33060?connect-timeout=0')
    .catch(err => {
        // should not reach this point for any timeout-related reason
    });
```

### Working with schemas

As usual in MySQL setups, you need to create or connect to an existing schema/database of your choice, which is basically the namespace under which your tables, views and collections will live. The `Session` instance provides the following constructs to manage database schemas.

Connecting to an existing schema using the connection URI:

```js
const mysqlx = require('@mysql/xdevapi');

// assuming the schema "foo" exists in the server
mysqlx.getSession('mysqlx://root@localhost:33060/foo')
    .then(session => {
        return session.getSchemas();
    })
    .then(schemas => {
        console.log(schemas); // [{ Schema: { name: 'foo' } }]
    });

// if the schema does not exist, an error will be thrown
mysqlx.getSession('mysqlx://root@localhost:33060/bar')
    .catch(err => {
        console.log(err.message); // Unknown database 'bar'
    });
```

Creating a new schema:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://root@localhost:33060')
    .then(session => {
        return session.createSchema('bar')
            .then(() => {
                return session.getSchemas();
            })
            .then(schemas => {
                console.log(schemas); // [{ Schema: { name: 'bar' } }]
            });
    });
```

Dropping an existing schema:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root@localhost:33060/foo')
    .then(session => {
        return session.dropSchema('foo')
            .then(() => {
                return session.getSchemas();
            })
            .then(schemas => {
                console.log(schemas); // []
            });
    });
```

### Connection pooling

You can also connect to a MySQL server using X Protocol connections managed by a proper pool. This can be done using the {@link module:Client|Client} interface. Similarly to the `mysqlx.getSession()` a connection pool is created using a connection string (or connection configuration options) as described before. Additionally, you can also provide custom pooling configuration options using a `pooling` property. The following options are available:

Option          | Meaning                                                                                       | Default
----------------|-----------------------------------------------------------------------------------------------|--------
enabled         | enable/disable pooling                                                                        | true
maxSize         | maximum number of connections supported by the pool                                           | 25
maxIdleTime     | maximum number of milliseconds to allow a connection to be idle (0 = infinite)                | 0
queueTimeout    | maximum number of milliseconds to wait for a connection to become available (0 = infinite)    | 0

Note: the pooling `queueTimeout` option is different from connection `connectTimeout` option. In a pooling scenario there are already connections in the pool, so `queueTimeout` controls how long to wait for a connection to be acquired from the pool, not how long to wait for that connection to be established.

#### Creating a pool with the default options

```js
const mysqlx = require('@mysql/xdevapi');

const client = mysqlx.getClient('mysqlx:root@localhost:33060');
client.getSession()
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', host: 'localhost', port: 33060, pooling: true, ... }
    });
```

### Creating a pool with custom configuration options

```js
const mysqlx = require('@mysql/xdevapi');

const client = mysqlx.getClient('mysqlx:root@localhost:33060', { pooling: { maxSize: 1, maxIdleTime: 1000, queueTimeout: 2000 } });
client.getSession()
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', host: 'localhost', port: 33060, pooling: true, ... }
    });
```

To release a connection from the pool, and make it available on subsequent connection requests, you can call the `close()` method available for each connection.

```js
const mysqlx = require('@mysql/xdevapi');

const client = mysqlx.getClient('mysqlx:root@localhost:33060', { pooling: { enabled: true, maxSize: 10 } });
client.getSession()
    .then(session => {
        return session.close();
    });
```

To destroy the pool and cleanup any unused references, you can call the `close()` method available in the {@link module:Client|Client} API.

```js
const mysqlx = require('@mysql/xdevapi');

const client = mysqlx.getClient('mysqlx:root@localhost:33060', { pooling: { queueTimeout: 2000, maxIdleTime: 1000 } });
client.getSession()
    .then(session => {
        return client.close();
    });
```

Overall, when connection pooling is enabled, the following scenarios are likely to happen when a connection is requested from a pool which contains `maxSize` connections:

1. A connection will become available once a previously existing session is explicitely closed.
2. No connection will become available, and the client will hang, when no previous session was explicitely closed, if both `queueTimeout` and `maxIdleTimeout` are set to their default values of `0` ms.
3. A timeout error will be thrown if the time specified by `queueTimeout` is exceeded.

Each X Protocol connection matches it's own regular X DevAPI {@link Session}, which means that everytime the {@link module:Client|Client} `getSession()` method is called, a new server session is also created with from a clean slate.

## Connection Attributes

You can attach custom operational details about the application using connection attributes and make that information available at the server side, under the following `PERFORMANCE_SCHEMA` tables:

- `session_account_connect_attrs`, attributes for the current session, and other sessions associated with the session
- `session_connect_attrs`, attributes for all sessions

These attributes are be defined when creating a new X DevAPI session and will be immutable during the life-time of that session. That means that you can’t use them to store transient information, such as the number of rows that have been processed up to a give point, or whether the connection has an active transaction, what line of application code is being executed, etc. They are useful for troubleshooting purposes nonetheless.

There are two different kinds of attributes. Client-defined attributes, are reserved key-value mappings implicitely encoded by the connector. User-defined attributes are key-value mappings provided by the user/application via the public API.

Connector/Node.js uses, by default, the following list of client-defined attributes:

- `_pid`, the process identifier on the machine where the application is running
- `_platform`, the platform architecture where the application is running
- `_os`, the platform name and version where the application is running (e.g `Linux-4.15.0`)
- `_source_host`, the hostname of the machine where the application is running
- `_client_name` (`mysql-connector-nodejs`)
- `_client_version`, the version of Connector/Node.js used by the application
- `_client_license` (`GPL-2.0`)

By default, in the following scenarios, when no attributes are defined explicitely, the client-defined attributes will be sent to the server regardless.

```js
mysqlx.getSession('mysqlx://root@localhost')

mysqlx.getSession({ user: 'root' })
mysqlx.getSession('{ "user": "root" }')

mysqlx.getSession('mysqlx://root@localhost?connection-attributes')
mysqlx.getSession('mysqlx://root@localhost?connection-attributes=')
mysqlx.getSession('mysqlx://root@localhost?connection-attributes=[]')

mysqlx.getSession({ user: 'root', connectionAttributes: {} })
mysqlx.getSession('{ "user": "root", "connectionAttributes": {} }')

mysqlx.getSession('mysqlx://root@localhost?connection-attributes=true')

mysqlx.getSession({ user: 'root', connectionAttributes: true })
mysqlx.getSession('{ "user": "root", "connectionAttributes": true }')
```

Sending user-defined attributes can be done like the following:

```js
mysqlx.getSession('mysqlx://root@localhost?connection-attributes=[foo=bar,baz=qux,quux]')
mysqlx.getSession('mysqlx://root@localhost?connection-attributes=[foo=bar,baz=qux,quux=]')

mysqlx.getSession({ user: 'root', connectionAttributes: { foo: 'bar', baz: 'qux', quux: '' } })
mysqlx.getSession({ user: 'root', connectionAttributes: { foo: 'bar', baz: 'qux', quux: undefined } })
mysqlx.getSession({ user: 'root', connectionAttributes: { foo: 'bar', baz: 'qux', quux: null } })

mysqlx.getSession('{ "user": "root", "connectionAttributes": { "foo": "bar", "baz": "qux", "quux": "" } }')
mysqlx.getSession('{ "user": "root", "connectionAttributes": { "foo": "bar", "baz": "qux", "quux": null } }')
```

Duplicate attribute names are not allowed when using a connection string. When using a plain JavaScript or JSON object, the last attribute value definition will stand. Client-defined attribute names start with an `"_"`, which means that this convention is not allowed for user-defined attributes. Also, due to schema restricitions by the `PERFORMANCE_SCHEMA` tables, the X Protocol only allows string-based key-value mappings, which means that non-primitive and/or nested values don't have first-class support and are "stringified" by default.

Also note that empty strings, `undefined` or `null` attribute values will be coerced to MySQL's `NULL` value.

You can disable this feature and avoid sending any attribute whatsoever (client-defined or user-defined) with one of the following:

```js
mysqlx.getSession('mysqlx://root@localhost?connection-attributes=false')
mysqlx.getSession({ user: 'root', connectionAttributes: false })
mysqlx.getSession('{ "user": "root", "connectionAttributes": false }')

mysqlx.getSession({ user: 'root', connectionAttributes: null })
mysqlx.getSession('{ "user": "root", "connectionAttributes": null }')

mysqlx.getSession({ user: 'root', connectionAttributes: undefined })
```

## Resolving SRV records for a given host

If you are using a DNS server or any kind or service discovery utility that supports mapping [SRV records](https://tools.ietf.org/html/rfc2782), you can create a connection to that host using the `mysqlx+srv` scheme/extension and Connector/Node.js will automatically resolve the available server addresses described by those SRV records.

For instance, with a DNS server at the `foo.abc.com` endpoint, with the following service mapping:

```txt
Record                    TTL   Class    Priority Weight Port  Target
_mysqlx._tcp.foo.abc.com. 86400 IN SRV   0        5      33060 foo1.abc.com
_mysqlx._tcp.foo.abc.com. 86400 IN SRV   0        10     33060 foo2.abc.com
_mysqlx._tcp.foo.abc.com. 86400 IN SRV   10       5      33060 foo3.abc.com
_mysqlx._tcp.foo.abc.com. 86400 IN SRV   20       5      33060 foo4.abc.com
```

the client will connect to the best target server, given its priority and weight.

```js
mysqlx.getSession('mysqlx+srv://root@_mysqlx._tcp.foo.abc.com')
    .then(session => {
        console.log(session.inspect().host); // foo2.abc.com
    });

mysqlx.getSession({ host: '_mysqlx._tcp.foo.abc.com', resolveSrv: true, user: 'root' })
    .then(session => {
        console.log(session.inspect().host); // foo2.abc.com
    });
```

If the highest-priority target server is not available, the most suitable alternative will be picked:

```js
// foo2.abc.com is down

mysqlx.getSession('mysqlx+srv://root@_mysqlx._tcp.foo.abc.com')
    .then(session => {
        console.log(session.inspect().host); // foo1.abc.com
    });

mysqlx.getSession({ host: '_mysqlx._tcp.foo.abc.com', resolveSrv: true, user: 'root' })
    .then(session => {
        console.log(session.inspect().host); // foo1.abc.com
    });
```

The behavior should apply to pooling connections as well, using the `mysqlx.getClient()` interface. A relevant scenario in a pooling setup is when a connection is released back to the pool, and the initial target host becomes unavailable either because it is down or it has been removed from the SRV record list. In that case, subsequent calls to `getSession()` should yield a connection to the next available host, according to the same rules established by priority and weight.

```js
const client = mysqlx.getClient('mysqlx+srv://root@_mysqlx._tcp.foo.abc.com');

client.getSession()
    .then(session => {
        console.log(session.inspect().host); // foo2.abc.com
        return session.close();
    })
    .then(() => {
        // In the meantime "foo2.abc.com" became unavailable
        return client.getSession();
    })
    .then(session => {
        console.log(session.inspect().host); // foo1.abc.com
    });
```

Note: attemping to create connections with UNIX sockets, server ports or multiple hostnames whilst enabling SRV resolution will result in an error.
