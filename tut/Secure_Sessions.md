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
