### TCP connections

By default, the connector creates a new session using SSL/TLS for TCP connections.

#### URI or unified-connection string

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx
    .getSession('mysqlx://foobar)
    .then(session => {
        console.log(session.inspect()); // { host: 'foobar', ssl: true }
    });
```

#### Connection options

```js
const mysqlx = require('@mysqlx/xdevapi');

const options = { host: 'foobar', ssl: true };

mysqlx
    .getSession(options)
    .then(session => {
        console.log(session.inspect()); // { host: 'foobar', ssl: true }
    });
```

If the server does not support secure TCP connections, the operation will fail.

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx
    .getSession('mysqlx://foobar)
    .catch(err => {
        console.log(err.message); // will print the error message
    });
```

### Unix socket connections

SSL/TLS doesn't make connections via local unix sockets any more secure, so, it is not available for sessions created using this kind of connections. Any security option provided as part of a local socket connection will be ignored (this is also the default behavior of the MySQL server).

## Disabling secure connections

The user can easily disable this feature explicitly (thus avoiding failures when using a server that does not support SSL/TLS connections):

#### URI or unified-connection string

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx
    .getSession('mysqlx://foobar?ssl-mode=DISABLED)
    .then(session => {
        console.log(session.inspect()); // { host: 'foobar', ssl: false }
    });
```

#### Connection options

```js
const mysqlx = require('@mysqlx/xdevapi');

const options = { host: 'foobar', ssl: false };

mysqlx
    .getSession(options)
    .then(session => {
        console.log(session.inspect()); // { host: 'foobar', ssl: false }
    });
```

## Additional security options

For additional security, the user is able to verify that the server certificate is signed and/or isn't revoked by a given certificate authority (each one works independently of the other). To enable this additional security step, a link to each PEM file (CA and CRL) should be provided (certificate chaining and ordering should be done by the user beforehand).

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx
    .getSession('mysqlx://foobar?ssl-ca=(/path/to/ca.pem)&ssl-crl=(/path/to/crl.pem)')
    .then(session => {
        console.log(session.inspect()); // { host: 'foobar', ssl: true }
    });
```

Note: file paths can be either [pct-encoded](https://en.wikipedia.org/wiki/Percent-encoding) or unencoded but enclosed by parenthesis (as demonstrated in the example).

#### Connection options

```js
const mysqlx = require('@mysqlx/xdevapi');

const options = { host: 'foobar', ssl: true, sslOptions: { ca: '/path/to/ca.pem', crl: '/path/to/crl.pem' } };

mysqlx
    .getSession(options)
    .then(session => {
        console.log(session.inspect()); // { host: 'foobar', ssl: true }
    });
```

## Authentication mechanisms

Currently, the MySQL X plugin supports the following authentication methods:

- [`MYSQL41`](https://dev.mysql.com/doc/internals/en/x-protocol-authentication-authentication.html#x-protocol-authentication-mysql41-authentication) (available for any kind of connection)
- [`PLAIN`](https://dev.mysql.com/doc/internals/en/x-protocol-authentication-authentication.html#x-protocol-authentication-plain-authentication) (requires TLS)

Since C/Node.js server connections are secure by default, unless one explicitely disables TLS support, the connection will use the `PLAIN` authentication method. The same happens if the server connection is established via a local UNIX socket (which does not support TLS). On the other hand, connections established via regular unencrypted TCP links will use the `MYSQL41` authentication method by default.

The user is allowed to override this automatic choice, and fallback to `MYSQL41` on secure connections. The same does not apply to insecure connections because the `PLAIN` authentication method requires TLS to be enabled.

#### Default security options (SSL enabled) and authentication mechanism

```js
const mysqlx = require('@mysql/xdevapi');

const options = {
    dbUser: 'foo',
    dbPassword: 'bar',
    host: 'localhost',
    port: 33060
};

mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().auth); // 'PLAIN'
    });
```

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://foo:bar@localhost:33060')
    .then(session => {
        console.log(session.inspect().auth); // 'PLAIN'
    });
```

### SSL disabled and default authentication mechanism

```js
const mysqlx = require('@mysql/xdevapi');

const options = {
    dbUser: 'foo',
    dbPassword: 'bar',
    host: 'localhost',
    port: 33060,
    ssl: false
};

mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    });
```

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://foo:bar@localhost:33060?ssl-mode=DISABLED')
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    });
```

### SSL enabled and default authentication mechanism

```js
const mysqlx = require('@mysql/xdevapi');

const options = {
    dbUser: 'foo',
    dbPassword: 'bar',
    host: 'localhost',
    port: 33060,
    ssl: true
};

mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().auth); // 'PLAIN'
    });
```

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://foo:bar@localhost:33060?ssl-mode=REQUIRED')
    .then(session => {
        console.log(session.inspect().auth); // 'PLAIN'
    });
```

### SSL enabled and custom authentication mechanism

```js
const mysqlx = require('@mysql/xdevapi');

const options = {
    auth: 'MYSQL41',
    dbUser: 'foo',
    dbPassword: 'bar',
    host: 'localhost',
    port: 33060,
    ssl: true
};

mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    });
```

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://foo:bar@localhost:33060?ssl-mode=REQUIRED&auth=MYSQL41')
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    });
```

### Local socket connection and default authentication mechanism

```js
const mysqlx = require('@mysql/xdevapi');

const options = {
    dbUser: 'foo',
    dbPassword: 'bar',
    host: 'localhost',
    port: 33060,
    socket: '/path/to/socket'
};

mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().auth); // 'PLAIN'
    });
```

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://foo:bar@(/path/to/socket)')
    .then(session => {
        console.log(session.inspect().auth); // 'PLAIN'
    });
```

### Local socket connection and custom authentication mechanism

```js
const mysqlx = require('@mysql/xdevapi');

const options = {
    auth: 'MYSQL41',
    dbUser: 'foo',
    dbPassword: 'bar',
    host: 'localhost',
    port: 33060,
    socket: '/path/to/socket'
};

mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    });
```

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://foo:bar@(/path/to/socket)?auth=MYSQL41')
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    });
```

### Failover with TLS enabled

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://foo:bar@[localhost:33060, 127.0.0.1:33061]')
    .then(session => {
        console.log(session.inspect().auth); // 'PLAIN'
    });
```

### Failover with TLS disabled

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://foo:bar@[localhost:33060, 127.0.0.1:33061]?ssl-mode=DISABLED')
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    });
```
