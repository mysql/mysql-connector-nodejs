You can establish a connection with a MySQL server by creating a `Session` through the `getSession()` method available in the main module API. The session will be established via the [X Plugin](https://dev.mysql.com/doc/refman/8.0/en/x-plugin.html) which, by default, listens on TCP port `33060`. Also, by default, X Protocol sessions are established using TLS and the `PLAIN` authentication method (more details available [here]{@tutorial Secure_Sessions}). You can resort to any of the following flavours to create a new session.

Using a standard [RFC 3986](https://tools.ietf.org/html/rfc3986) URI:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root:passwd@localhost:33060/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', host: 'localhost', port: 33060 }
    })
```

Using a "unified" connection string, which is basically a reduced version of the RFC 3986 URI (without the _scheme_):

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('root:passwd@localhost:33060/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', host: 'localhost', port: 33060 }
    })
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

mysqlx
    .getSession(config)
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', host: 'localhost', port: 33060 }
    })
```

If the server is running in the same machine as the client, and is bound to a local UNIX socket (no support for windows pipes yet), the previous examples work, with some small notation differences.

Using a standard [RFC 3986](https://tools.ietf.org/html/rfc3986) URI with a pct-encoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root:passwd@%2Fpath%2Fto%2Fsocket/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', socket: '/path/to/socket' }
    })
```

Using a standard [RFC 3986](https://tools.ietf.org/html/rfc3986) URI with an unencoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root:passwd@(/path/to/socket)/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', socket: '/path/to/socket' }
    })
```

Using a "unified" connection string with a pct-encoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('root:passwd@%2Fpath%2Fto%2Fsocket/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', socket: '/path/to/socket' }
    })
```

Using a "unified" connection string with an unencoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('root:passwd@(/path/to/socket)/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', socket: '/path/to/socket' }
    })
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

mysqlx
    .getSession(config)
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', socket: '/path/to/socket' }
    })
```

### Failover

You can provide multiple MySQL router or server addresses (host and port) when creating a session. This allows the connector to perform automatic failover selection when the hosts are not available. The selection is made based on the priority assigned to each address, either implicitely (position in the list), or explicitely (using a special format depicted above).

Explicit priorities should start at `0` (lowest priority) and finish at `100` (highest priority). When two addresses share the same priority, the first one from the list will be selected.

Setting-up failover servers with implicit priority:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root:passwd@[localhost:33060, 127.0.0.1:33060]')
    .then(session => {
        // the `host` and `port` properties will match the first available server endpoint
        console.log(session.inspect());
    });
```

Setting-up failover servers with explicit priority:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root:passwd@[(address=127.0.0.1:33060, priority=99), (address=localhost:33060, priority=100)]')
    .then(session => {
        // the `host` and `port` properties will match the first available server endpoint
        console.log(session.inspect());
    });
```

### Connection timeout

By default, the initial server connection will timeout after 10 seconds in a single-host scenario, and after 10 seconds for each connection attempt in a multi-host scenario. You can override this behavior by providing a custom timeout value, which should be an integer representing the number of `ms` to wait for a valid connection.

In a single-host scenario, when a connection is not established in the defined interval, the following should happen:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root:passwd@localhost:33060?connect-timeout=5000')
    .catch(err => {
        // connection could not be established after 5 seconds
        console.log(err.message); // Connection attempt to the server was aborted. Timeout of 5000 ms was exceeded.
    });
```

As usual you can also set a custom value using a plain JavaScript object, whose counterpart property name is, in this case, `connectTimeout`.

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession({ user: 'root', password: 'passwd', connectTimeout: 8000 })
    .catch(err => {
        // connection could not be established after 8 seconds
        console.log(err.message); // Connection attempt to the server was aborted. Timeout of 8000 ms was exceeded.
    });
```

In a multi-host scenario, the error message will be a bit different:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root:passwd@[localhost:33060, 127.0.0.1:33060]?connect-timeout=5000')
    .catch(err => {
        // connection could not be established after 10 seconds (5 seconds for each server)
        console.log(err.message); // All server connection attempts were aborted. Timeout of 5000 ms was exceeded for each selected server.
    });
```

To explicitly disable the timeout, you can use `connect-timeout=0`.

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://root:passwd@127.0.0.1:33060?connect-timeout=0')
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
