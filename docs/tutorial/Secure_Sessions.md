By default, the connector creates a new session using SSL/TLS for TCP connections.

```javascript
const mysqlx = require('@mysql/xdevapi');

// using a connection string
mysqlx.getSession('mysqlx://localhost')
    .then(session => {
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });

// using a configuration object
mysqlx.getSession({ host: 'localhost' })
    .then(session => {
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

If the server does not support secure TCP connections, the operation will fail.

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost')
    .catch(err => {
        console.log(err.message); // will print the error message
    });
```

Note: SSL/TLS is not used with local Unix sockets.

### Disabling secure connections

The user can easily disable this feature explicitly (thus avoiding failures when using a server that does not support SSL/TLS connections):

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost?ssl-mode=DISABLED')
    .then(session => {
        console.log(session.inspect()); // { host: 'localhost', tls: false }
    });

// or using a plain JavaScript configuration object
const options = { host: 'localhost', tls: { enabled: false } };

mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect()); // { host: 'localhost', tls: false }
    });
```

### Additional security options

For additional security, the user is able to customize the setup and do other things such as provide a list of hand-picked TLS protocol versions, verify that the server certificate is signed and/or isn't revoked by a given certificate authority (each one works independently of the other). To enable this additional security step, a link to each PEM file (CA and CRL) should be provided (certificate chaining and ordering should be done by the user beforehand). All these options are interchangeable and decoupled, altough a CRL is of no use in the absense of an associated CA.

#### TLS versions

A handpicked list of allowed TLS versions can be defined. Alternatively the client will rely on a default list of versions it supports, which includes `TLSv1.2` and `TLSv1.3` (depending on the Node.js version).

> **IMPORTANT**<br />
> Since version 8.0.28, only TLSv1.2 and TLSv1.3 are effectively supported.
> As long as one or both are part of the list of TLS versions, the client tries to pick the most appropriate one to use when connecting to the server, however, if the list contains only TLSv1 and/or TLSv1.1, the client reports an error.

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost?tls-versions=[TLSv1.2,TLSv1.3]')
    .catch(err => {
        console.log(err.message); // { host: 'localhost', tls: true }
    });


const options = { host: 'localhost', tls: { enabled: true, versions: ['TLSv1.2', 'TLSv1.3'] } };

mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

With Node.js v10.0.0 (or higher), where the TLS negotiation supports a range of versions, as long as the MySQL server supports the oldest TLS version in the list, the connection will be sucessful. However, on older Node.js versions, where range negotiation is not supported, since the client picks up the latest TLS version in the list by default, the connection will fail if the server does not support that specific version.

```javascript
const mysqlx = require('@mysql/xdevapi');

// With older Node.js versions, if the server does not support TLSv1.3
mysqlx.getSession('mysqlx://localhost?tls-versions=[TLSv1.2,TLSv1.3]')
    .catch(err => {
        console.log(err.message); // OpenSSL wrong version number error
    });

// With Node.js >=v10.0.0, with support for range-based negotiation, TLSv1.2 will be used
mysqlx.getSession('mysqlx://localhost?tls-versions=[TLSv1.2,TLSv1.3]')
    .then(session => {
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

If the oldest version of TLS supported by the server is newer than the one used by the client, the socket will hang up during the negotiation or will close with a fatal error, depending on the Node.js (and OpenSSL) version.

```javascript
const mysqlx = require('@mysql/xdevapi');

// The server supports only TLSv1.3
mysqlx.getSession('mysqlx://localhost?tls-versions=[TLSv1.2]')
    .catch(() => {
        // does not connect
    });
```

#### TLS Ciphersuites

Connector/Node.js passes the following default ciphersuite list to the OpenSSL package that is statically linked with the available Node.js engine:

```
TLS_ECDHE_ECDSA_WITH_AES_128_GCM_SHA256
TLS_ECDHE_ECDSA_WITH_AES_256_GCM_SHA384
TLS_ECDHE_RSA_WITH_AES_128_GCM_SHA256
TLS_AES_128_GCM_SHA256
TLS_AES_256_GCM_SHA384
TLS_CHACHA20_POLY1305_SHA256
TLS_AES_128_CCM_SHA256
TLS_AES_128_CCM_8_SHA256
TLS_ECDHE_RSA_WITH_AES_256_GCM_SHA384
TLS_DHE_RSA_WITH_AES_128_GCM_SHA256
TLS_DHE_DSS_WITH_AES_128_GCM_SHA256
TLS_DHE_DSS_WITH_AES_256_GCM_SHA384
TLS_DHE_RSA_WITH_AES_256_GCM_SHA384
TLS_ECDHE_ECDSA_WITH_CHACHA20_POLY1305_SHA256
TLS_ECDHE_RSA_WITH_CHACHA20_POLY1305_SHA256
TLS_DH_DSS_WITH_AES_128_GCM_SHA256
TLS_ECDH_ECDSA_WITH_AES_128_GCM_SHA256
TLS_DH_DSS_WITH_AES_256_GCM_SHA384
TLS_ECDH_ECDSA_WITH_AES_256_GCM_SHA384
TLS_DH_RSA_WITH_AES_128_GCM_SHA256
TLS_ECDH_RSA_WITH_AES_128_GCM_SHA256
TLS_DH_RSA_WITH_AES_256_GCM_SHA384
TLS_ECDH_RSA_WITH_AES_256_GCM_SHA384
TLS_DHE_RSA_WITH_AES_256_CBC_SHA
TLS_DHE_RSA_WITH_AES_128_CBC_SHA
TLS_RSA_WITH_AES_256_CBC_SHA
```

The last three ciphersuites from the list are deprecated, and exist only to provide compatibility with older MySQL server versions based on WolfSSL/YaSSL.

Applications are allowed to override this list by providing their own set of ciphersuites, using the respective IANA name, like the following:

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('mysqlx://localhost?tls-ciphersuites=[TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256,TLS_DHE_RSA_WITH_AES_128_CBC_SHA256]')
    .then(session => {
        console.log(session.inspect()); // { host: 'foobar', tls: true }
    });

const options = { host: 'localhost', tls: { ciphersuites: ['TLS_ECDHE_RSA_WITH_AES_128_CBC_SHA256', 'TLS_DHE_RSA_WITH_AES_128_CBC_SHA256'], enabled: true } };

mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

Applications are free to use older TLSv1 and TLSv1.1 compatible ciphersuites (like it is depicted in the above example) but these are not recommended.

Non-TLS ciphersuites, including the `MD5`, `SSLv3` and other older sets are not supported and will be ignored if the application wants to use them. If none of the ciphers provided by the application is actually supported by the client, an error will be thrown.

#### Certificate Authority Validation

When creating a connection to the database using TLS, the connector can validate if the server certificate was signed by a certificate authority (CA) and, at the same time, ensure that the certificate was not revoked by that same authority, or any other in a given chain of trust.

Just like with TLS-related core Node.js APIs, an application can provide one or more PEM formatted CA certificates and certificate revocation lists (CRL). The [secure context](https://nodejs.org/docs/v14.0.0/api/tls.html#tls_tls_createsecurecontext_options) uses a list of well-known CAs curated by Mozilla, which are completely replaced by the list of CAs provided by an application. This means that if the certificate was not signed by the root CA, the entire chain of trust down to the signing CA, should be included in the list. The same is true for the certificate revocation lists, because each CA has its own.

Verifying if the server certificate was signed by the root CA can be done by providing the path to the CA file. When using a connection string, this feature needs to be explicitly enabled by setting value of `ssl-mode` to `VERIFY_CA` or `VERIFY_IDENTITY` (which will also validate the server identity against its own certificate).

> **IMPORTANT**<br />
> When using a connection string, if the `ssl-mode` option is not set whilst providing a path to a certificate authority file, the verification does not happen and the client will yield a warning message.

```javascript
const mysqlx = require('@mysql/xdevapi');
const path = require('path');

mysqlx.getSession('mysqlx://localhost?ssl-mode=VERIFY_CA&ssl-ca=(/path/to/root/ca.pem)')
    .then(session => {
        // the connection succeeds if the server certificate was signed by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });


const options = {
    host: 'localhost',
    tls: {
        ca: path.join('/', 'path', 'to', 'root', 'ca.pem')
    }
};

mysqlx.getSession(options)
    .then(session => {
        // the connection succeeds if the server certificate was signed by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

Or, additionally, by reading the file contents beforehand:

```javascript
const fs = require('fs');
const mysqlx = require('@mysql/xdevapi');

const options = {
    host: 'localhost',
    tls: {
        ca: fs.readFileSync('/path/to/root/ca.pem')
    }
};

mysqlx.getSession(options)
    .then(session => {
        // the connection succeeds if the server certificate was signed by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

When the server certificate is not signed by the root CA, but instead by an intermediate or leaf CA in the chain of trust, all the CAs down to the one that has actually signed the certificate, need to be provided.

This using a single PEM file that concatenates the entire chain of trust.

```javascript
const mysqlx = require('@mysql/xdevapi');
const path = require('path');

// /path/to/chain/ca.pem should contain the entire chain of trust
mysqlx.getSession('mysqlx://localhost?ssl-mode=VERIFY_CA&ssl-ca=(/path/to/chain/ca.pem)')
    .then(session => {
        // the connection succeeds if the server certificate was signed by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });

mysqlx.getSession(`mysqlx://localhost?ssl-mode=VERIFY_CA&ssl-ca=${encodeURIComponent('/path/to/chain/ca.pem')}`)
    .then(session => {
        // the connection succeeds if the server certificate was signed by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });


let options = {
    host: 'localhost',
    tls: {
        // /path/to/chain/ca.pem should contain the entire chain of trust
        ca: path.join('/', 'path', 'to', 'chain', 'ca.pem')
    }
};

mysqlx.getSession(options)
    .then(session => {
        // the connection succeeds if the server certificate was signed by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

Or using multiple PEM files for the entire chain of trust. In this case, there is no support to provide multiple file paths in the connection string, which means applications should use a connection configuration object.

```javascript
const fs = require('fs')
const mysqlx = require('@mysql/xdevapi');
const path = require('path')

const options = {
    host: 'localhost',
    tls: {
        ca: [
            fs.readFileSync(path.join('/', 'path', 'to', 'leaf', 'ca.pem')),
            fs.readFileSync(path.join('/', 'path', 'to', 'root', 'ca.pem'))
        ]
    }
};

mysqlx.getSession(options)
    .then(session => {
        // the connection succeeds if the server certificate was signed by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

The connector can also verify if the server certificate was revoked by any CA in the chain of trust. In this case, due to some design constraints in the Node.js OpenSSL bindings, providing a single file containing the CRLs for every CA in the chain of trust is not possible, so applications must provide *ALL* CRL files individually to ensure the verification works as expected (this is also required because OpenSSL uses the [X509_V_FLAG_CRL_CHECK_ALL](https://www.openssl.org/docs/man1.1.0/man3/X509_VERIFY_PARAM_set_flags.html) flag by default as a verification parameter).

```javascript
const fs = require('fs')
const mysqlx = require('@mysql/xdevapi');
const path = require('path');

const options = {
    host: 'localhost',
    tls: {
        ca: [
            fs.readFileSync(path.join('/', 'path', 'to', 'leaf', 'ca.pem')),
            fs.readFileSync(path.join('/', 'path', 'to', 'root', 'ca.pem'))
        ],
        crl: [
            fs.readFileSync(path.join('/', 'path', 'to', 'leaf', 'crl.pem')),
            fs.readFileSync(path.join('/', 'path', 'to', 'root', 'crl.pem'))
        ],
    }
};

mysqlx.getSession(options)
    .then(session => {
        // the connection succeeds if the server certificate was not revoked neither the leaf CA nor the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

When the chain of trust contains only the root CA and CRL, every API flavour should work.

```javascript
const fs = require('fs')
const mysqlx = require('@mysql/xdevapi');
const path = require('path');

mysqlx.getSession('mysqlx://localhost?ssl-mode=VERIFY_CA&ssl-ca=(/path/to/root/ca.pem)&ssl-crl=(/path/to/root/crl.pem)')
    .then(session => {
        // the connection succeeds if the server certificate was not revoked by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });

mysqlx.getSession(`mysqlx://localhost?ssl-mode=VERIFY_CA&ssl-ca=${encodeURIComponent('/path/to/root/ca.pem')}&ssl-crl=${encodeURIComponent('/path/to/root/crl.pem')}`)
    .then(session => {
        // the connection succeeds if the server certificate was not revoked by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });


let options = {
    host: 'localhost',
    tls: {
        ca: path.join('/', 'path', 'to', 'root', 'ca.pem'),
        crl: path.join('/', 'path', 'to', 'root', 'crl.pem')
    }
};

mysqlx.getSession(options)
    .then(session => {
        // the connection succeeds if the server certificate was not revoked by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });

options.tls.ca = fs.readFileSync(path.join('/', 'path', 'to', 'root', 'ca.pem'));
options.tls.crl = fs.readFileSync(path.join('/', 'path', 'to', 'root', 'crl.pem'));

mysqlx.getSession(options)
    .then(session => {
        // the connection succeeds if the server certificate was not revoked by the root CA
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });
```

> **IMPORTANT**<br />
> Due to the constraints imposed by connection strings, the fact that all core Node.js TLS-related APIs expect PEM file content as input, and the fact that Node.js and OpenSSL cannot verify CRLs concatenated in a single file, it is strongly recommended that applications always use a connection configuration object to specify one or more PEM files for CAs and CRLs using "fs.readFileSync()".

### Checking the Server Identity

Besides verifying if the server certificate was signed or revoked by a certificate in a given authority chain, it is also possible to additionally verify if the server is the effective owner of the certificate, by comparing the server hostname and the common name specified by the certificate, according to a specific set of prerequisites. This check is only performed if the certificate first passes all the other checks, such as being issued by a given CA (required).

When using a connection configuration object, this can be done by providing an additional `checkServerIdentity` property as part of the secure context. If its value is `true`, the server identity check will happen using the builtin [`tls.checkServerIdentity()`](https://nodejs.org/docs/v14.0.0/api/tls.html#tls_tls_checkserveridentity_hostname_cert) function, which expects both the server hostname and certificate common name to be exactly the same.

```js
const fs = require('fs')
const mysqlx = require('@mysql/xdevapi');
const path = require('path');

let options = {
    host: 'localhost',
    tls: {
        ca: path.join('/', 'path', 'to', 'ca.pem'),
        checkServerIdentity: true
    }
};

// CN = 'localhost'
mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });

// CN = 'example.com'
mysqlx.getSession(options)
    .catch(err => {
        console.log(err.message); // Hostname/IP does not match certificate's altnames: Host: localhost. is not cert's CN: example.com
    });
```

An application can specify its own set of requirements to determine if the server identity is valid. This can be done by providing a custom `checkServerIdentity()` function. As an example, this can be useful, for instance to allow subdomains.

```js
const fs = require('fs')
const mysqlx = require('@mysql/xdevapi');
const path = require('path');

let options = {
    host: 'dev.mysql.com',
    tls: {
        ca: path.join('/', 'path', 'to', 'ca.pem'),
        checkServerIdentity (hostname, cert) {
            // Checks if the domain is the same.
            if (cert.subject.CN === hostname.substring(hostname.length - cert.subject.CN.length)) {
                return true;
            }

            // Instead of being thrown, the error needs to be returned back to the client.
            return new Error(`"${hostname}" is not a valid subdomain of "${cert.subject.cn}"`);
        }
    }
};

// CN = 'mysql.com'
mysqlx.getSession(options)
    .then(session => {
        console.log(session.inspect()); // { host: 'dev.mysql.com', tls: true }
    });

// CN = 'example.com'
mysqlx.getSession(options)
    .catch(err => {
        console.log(err.message); // "dev.mysql.com" is not a valid subdomain of "example.com"
    });
```

By default, if the `checkServerIdentity` property is not specified, the check will not be performed.

> **IMPORTANT**<br />
> Custom `checkServerIdentity()` functions should "return" all errors instead "throwing" them. Further implementation details are available in the official Node.js [documentation](https://nodejs.org/docs/v14.0.0/api/tls.html#tls_tls_checkserveridentity_hostname_cert).

When using a connection string, the API is a little bit more restricted. The only possibility is to set the value of the `ssl-mode` option to `VERIFY_IDENTITY` in order to explicitly enable the server identity check using the builtin `tls.checkServerIdentity()` function.

```js
const fs = require('fs')
const mysqlx = require('@mysql/xdevapi');
const path = require('path');

const ca = path.join('path', 'to', 'ca.pem');

// CN = 'localhost'
mysqlx.getSession(`mysqlx://localhost?ssl-mode=VERIFY_IDENTITY&ssl-ca=${encodeURIComponent(ca)}`)
    .then(session => {
        console.log(session.inspect()); // { host: 'localhost', tls: true }
    });

// CN = 'example.com'
mysqlx.getSession(`mysqlx://localhost?ssl-mode=VERIFY_IDENTITY&ssl-ca=${encodeURIComponent(ca)}`)
    .catch(err => {
        console.log(err.message); // Hostname/IP does not match certificate's altnames: Host: localhost. is not cert's CN: example.com
    });
```

### Authentication Mechanisms

Currently, the MySQL X plugin supports the following authentication methods:

- [`MYSQL41`](https://dev.mysql.com/doc/internals/en/x-protocol-authentication-authentication.html#x-protocol-authentication-mysql41-authentication) (available for any kind of connection)
- [`PLAIN`](https://dev.mysql.com/doc/internals/en/x-protocol-authentication-authentication.html#x-protocol-authentication-plain-authentication) (requires TLS)
- `SHA256_MEMORY` (requires previously cached password)

Since server connections are secure by default, unless one explicitely disables TLS support, the connection will use the `PLAIN` authentication mechanism. The same happens if the server connection is established via a local UNIX socket (albeit not over TLS).

On the other hand, connections established via regular unencrypted TCP links will try to authenticate the user via `MYSQL41` first, if that does not work, `SHA256_MEMORY` authentication will then be attempted and finally, if none of those work, the client will just relay the server error.

The `SHA256_MEMORY` authentication mechanism will only work if the server already contains the account password in the authentication cache, after an earlier authentication attempt using a different mechanism.

The user is allowed to override this automatic choice, and fallback to `MYSQL41` on secure connections. The same does not apply to insecure connections because the `PLAIN` authentication mechanism requires TLS. There are some other rules to have in mind with regards to the compabitility between client authentication mechanism and server authentication plugins associated to each database user account.

Below is an overview of the major compatibility rules, which change based not only if the server connection uses TLS or unix sockets (secure - S) or uses an unencrypted TCP channel (insecure - N) but also on the server version. The examples provided are valid for MySQL 8.0.11 or later versions.

#### `mysql_native_password`

The `mysql_native_password` authentication plugin is used by default from [MySQL 5.7](https://dev.mysql.com/doc/refman/5.7/en/native-pluggable-authentication.html) up to [MySQL 8.0.11](https://dev.mysql.com/doc/refman/8.0/en/native-pluggable-authentication.html).

| Authentication mechanism  | 5.7 (S)   | 5.7 (N)   | 8.0.11 (S) | 8.0.11 (N) |
| --------------------------|-----------|-----------|------------|------------|
| `MYSQL41`                 | OK        | OK        | OK         | OK         |
| `PLAIN`                   | OK        | NO        | OK         | NO         |
| `SHA256_MEMORY`           | N/A       | N/A       | OK         | OK         |

`MYSQL41` will always work, whereas `PLAIN` will only work over TLS. `SHA256_MEMORY` requires the password to be previously cached (see examples below).

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('root@localhost?auth=MYSQL41')
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    })

mysqlx.getSession({ auth: 'MYSQL41', tls: false, user: 'root' })
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    })

mysqlx.getSession('root@localhost?ssl-mode=DISABLED')
    .then(session => {
        console.log(session.inspect().auth); // 'MYSQL41'
    })

mysqlx.getSession({ user: 'root' })
    .then(session => {
        console.log(session.inspect().auth); // 'PLAIN'
    })

mysqlx.getSession('root@localhost?auth=PLAIN&ssl-mode=DISABLED')
    .catch(err => {
        console.log(err.message); // 'Invalid user or password'
    });
```

#### `caching_sha2_password`

The `caching_sha2_password` authentication plugin was introduced with [MySQL 8.0.11](https://dev.mysql.com/doc/refman/8.0/en/caching-sha2-pluggable-authentication.html) and is used by default since then. It is not supported on older server versions.

| Authentication mechanism  | 5.7 (S)   | 5.7 (N)   | 8.0.11 (S) | 8.0.11 (N) |
| --------------------------|-----------|-----------|------------|------------|
| `MYSQL41`                 | N/A       | N/A       | NO         | NO         |
| `PLAIN`                   | N/A       | N/A       | OK         | NO         |
| `SHA256_MEMORY`           | N/A       | N/A       | OK         | OK         |

To save the password on the server cache, first, the client must authenticate using `PLAIN` over TLS. Any other authentication setup will not work.

```javascript
const mysqlx = require('@mysql/xdevapi');

mysqlx.getSession('root@localhost')
    .then(session => {
        console.log(session.inspect().auth); // 'PLAIN'

        return mysqlx.getSession('root@localhost?auth=SHA256_MEMORY')
    })
    .then(session => {
        console.log(session.inspect().auth); // 'SHA256_MEMORY'
    });

mysqlx.getSession('root@localhost?ssl-mode=DISABLED')
    .catch(err => {
        console.log(err.message); // 'Authentication failed using "MYSQL41" and "SHA256_MEMORY", check username and password or try a secure connection.'
    });

mysqlx.getSession('root@localhost?auth=MYSQL41')
    .catch(err => {
        console.log(err.message); // 'Invalid user or password'
    });
```
