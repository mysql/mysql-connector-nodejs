Previously defined configurations can be easily re-used when creating a new session. Persistent session configurations are enabled trough a simple `JSON` file that includes the list of sessions (indexed by their name), each one containing the respective URI and additional application data that might be tied to the session.

There are two kinds of session configuration files available for this purpose - `system` configuration data and `user` configuration data. The first servers as a kind of base template wherein details of a given session available in the second will get precedence.

A `system` session configuration file is meant to be read-only and should be manually created by the user at `/etc/mysql/sessions.json` on UNIX-based systems and at `%PROGRAMDATA%MySQL%sessions.json` on Windows. The `user` session configuration file can be manually created by the user, or managed by the application itself at `~/.mysql/sessions.json` on UNIX and at `%APPDATA%MySQL%sessions.json` on Windows.

Currently, there is no standard way to store sensitive data (such as user passwords) within the persistent configuration thus, those kind of parameters must be explicitely provided everytime a new session is created.

### Loading a persistent session configuration

A persistent session configuration can be loaded provided its name. When loading one, additional parameters might be provided which will override their matching parameters in the persistent session configuration file (if they exist) or will simply be added to the session being created.

#### Explicit loading

```js
const mysqlx = require('@mysql/xdevapi');

mysqlx.config
    .get('<session_name>')
    .then(configuration => {
        return mysqlx.getSession(configuration, '<user_password>')
    })
    .then(session => {
        console.log('Session created using a persistent configuration');
    });
```

#### Implicit loading

```js
const mysqlx = require('@mysql/xdevapi');

// Using a plain object or dictionary
mysqlx
    .getSession({ sessionName: '<session_name>', dbPassword: '<user_password>' }})
    .then(session => {
        console.log('Session created using a persistent configuration');
    });

// Using a JSON string
mysqlx
    .getSession('{ "sessionName": "<session_name>", "dbPassword": "<user_password>" }')
    .then(session => {
        console.log('Session created using a persistent configuration');
    });
```
