You can establish a connection with a MySQL server by creating a `Session` through the `getSession()` method available in the main module API. The session will be established via the [X Plugin](https://dev.mysql.com/doc/refman/8.0/en/x-plugin.html) which, by default, listens on TCP port `33060`. Also, by default, X Protocol sessions are established using TLS and the `PLAIN` authentication method (more details available [here]{@tutorial Secure_Sessions.md}). You can resort to any of the following flavours to create a new session.

Using a standard [RFC 3986](https://tools.ietf.org/html/rfc3986) URI:

```js
const mysqlx = require('@mysql/xdevapi');

msyqlx
    .getSession('mysqlx://root:passwd@localhost:33060/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', host: 'localhost', port: 33060, schema: 'mySchema' }
    })
```

Using a "unified" connection string, which is basically a reduced version of the RFC 3986 URI (without the _scheme_):

```js
const mysqlx = require('@mysql/xdevapi');

msyqlx
    .getSession('root:passwd@localhost:33060/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', host: 'localhost', port: 33060, schema: 'mySchema' }
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

msyqlx
    .getSession(config)
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', host: 'localhost', port: 33060, schema: 'mySchema' }
    })
```

If the server is running in the same machine as the client, and is bound to a local UNIX socket (no support for windows pipes yet), the previous examples work, with some small notation differences.

Using a standard [RFC 3986](https://tools.ietf.org/html/rfc3986) URI with a pct-encoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

msyqlx
    .getSession('mysqlx://root:passwd@%2Fpath%2Fto%2Fsocket/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', schema: 'mySchema', socket: '/path/to/socket' }
    })
```

Using a standard [RFC 3986](https://tools.ietf.org/html/rfc3986) URI with an unencoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

msyqlx
    .getSession('mysqlx://root:passwd@(/path/to/socket)/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', schema: 'mySchema', socket: '/path/to/socket' }
    })
```

Using a "unified" connection string with a pct-encoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

msyqlx
    .getSession('root:passwd@%2Fpath%2Fto%2Fsocket/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', schema: 'mySchema', socket: '/path/to/socket' }
    })
```

Using a "unified" connection string with an unencoded socket path:

```js
const mysqlx = require('@mysql/xdevapi');

msyqlx
    .getSession('root:passwd@(/path/to/socket)/mySchema')
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', schema: 'mySchema', socket: '/path/to/socket' }
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

msyqlx
    .getSession(config)
    .then(session => {
        console.log(session.inspect());
        // { user: 'root', schema: 'mySchema', socket: '/path/to/socket' }
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

### Working with schemas

As usual in MySQL setups, you need to create or connect to an existing schema/database of your choice, which is basically the namespace under which your tables, views and collections will live. The `Session` instance provides the following constructs to manage database schemas.

Creating a new schema implicitely, using the connection URI:

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx
    .getSession('mysqlx://localhost:33060/foo')
    .then(session => {
        return session.getSchemas();
    })
    .then(schemas => {
        console.log(schemas); // [{ Schema: { name: 'foo' } }]
    });
```

Creating a new schema explicitely:

```js
const mysqlx = require('@mysql/xdevapi');

const connection = {};

mysqlx
    .getSession('mysqlx://localhost:33060')
    .then(session => {
        connection.session = session;

        return session.createSchema('foo');
    })
    .then(() => {
        return session.getSchemas();
    })
    .then(schemas => {
        console.log(schemas); // [{ Schema: { name: 'foo' } }]
    });
```

Dropping an existing schema:

```js
const mysqlx = require('@mysql/xdevapi');

const connection = {};

mysqlx
    .getSession('mysqlx://localhost:33060/foo')
    .then(session => {
        connection.session = session;

        return session.dropSchema('foo');
    })
    .then(() => {
        return session.getSchemas();
    })
    .then(schemas => {
        console.log(schemas); // []
    });
```
