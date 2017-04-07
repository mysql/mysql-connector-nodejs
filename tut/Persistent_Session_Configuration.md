Previously defined configurations can be easily re-used when creating a new session. Persistent session configurations are enabled trough a simple `JSON` file that includes the list of sessions (indexed by their name), each one containing the respective URI and additional application data that might be tied to the session.

There are two kinds of session configuration files available for this purpose - `system` configuration data and `user` configuration data. The first serves as a kind of base template wherein details of a given session available in the second will get precedence.

A `system` session configuration file is meant to be read-only and should be manually created by the user at `/etc/mysql/sessions.json` on UNIX-based systems and at `%PROGRAMDATA%MySQL%sessions.json` on Windows. The `user` session configuration file can be manually created by the user, or managed by the application itself at `~/.mysql/sessions.json` on UNIX and at `%APPDATA%MySQL%sessions.json` on Windows.

Currently, there is no standard way to store sensitive data (such as user passwords) within the persistent configuration thus, those kind of parameters must be explicitely provided everytime a new session is created.

### Saving a new persistent session

A persistent session can be saved to disk by providing a proper session name (alphanumeric, with less then 33 characters), and the standard sessions parameters using either a configuration object/dictionary (JSON string or plain object) or an URI string.

### Using a plain object or dictionary

```js
const mysqlx = require('@mysqlx/xdevapi');

const properties = {
    host: 'localhost',
    appdata: {
        foo: 'bar',
    },
    baz: 'qux'
};

mysqlx.config
    .save('<session_name>', properties)
    .then(configuration => {
        return mysqlx.getSession(configuration, '<user_password>')
    })
    .then(session => {
        console.log('Session created using a persistent configuration');
    })
```

Note: all unknown session parameters will be merged into the `appdata` object. In this case, `appdata` will contain `{ foo: 'bar', baz: 'qux' }`. Additionally, using the same kind of properties object converted into a JSON string - `JSON.stringify(properties)` - will also work.

### Using an URI string

```js
const mysqlx = require('@mysqlx/xdevapi');

const appdata = {
    foo: 'bar',
    baz: 'qux'
};

mysqlx.config
    .save('<session_name>', 'mysqlx://localhost', appdata)
    .then(configuration => {
        return mysqlx.getSession(configuration, '<user_password>')
    })
    .then(session => {
        console.log('Session created using a persistent configuration');
    })
```

Note: in this case, the `appdata` object must be provided as an additional argument when calling `save()`.

### Loading a persistent session

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

### Getting the name of a persistent session

A `list()` method is available to access the names of the existing persistent sessions.

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx.config.list().then(sessions => {
    console.log(sessions); // ['foo', 'bar', 'baz', 'qux']
});
```

### Updating an existing persistent session

To update an existing persistent session, one can access the session configuration API via either of the above-mentioned `save()` or `get()` global methods. The API provides methods to update the URI - `setUri()` - and application-specific parameters - `setAppData()`.

#### Newly created sessions

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx.config
    .save('<session_name>', 'mysqlx://localhost', { foo: 'bar' })
    .then(configuration => {
        configuration.setUri('mysqlx://127.0.0.1');
        configuration.setAppData('foo', 'baz');

        return configuration.save();
    })
    .then(configuration => {
        console.log(configuration.getUri()); // mysqlx://127.0.0.1
        console.log(configuration.getAppData('foo')); // baz

        return mysqlx.getSession(configuration, '<user_password>');
    })
    .then(session => {
        console.log('Session created using a persistent configuration');
    });
```

#### Existing sessions

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx.config
    .get('<session_name>')
    .then(configuration => {
        configuration.setUri('mysqlx://127.0.0.1');
        configuration.setAppData('foo', 'baz');

        return configuration.save();
    })
    .then(configuration => {
        console.log(configuration.getUri()); // mysqlx://127.0.0.1
        console.log(configuration.getAppData('foo')); // baz

        return mysqlx.getSession(configuration, '<user_password>');
    })
    .then(session => {
        console.log('Session created using a persistent configuration');
    });
```

### Deleting a persistent session

Deleting a persistent session means that the session entry (including properties) are to be removed from the user-specific configuration file (as described above). Since the system-specific configuration file is meant to be read-only, any session details it might contain  need to be removed manually, otherwise, the session will continue to exist.

```js
const mysqlx = require('@mysqlx/xdevapi');

mysqlx.config
    .save({ sessionName: '<session_name>', host: '127.0.0.1', foo: 'bar' })
    .then(sessionConfig => {
        console.log(sessionConfig.getUri()); // mysqlx://127.0.0.1

        return mysqlx.config.delete('<session_name>');
    })
    .then(status => {
        // Returns `true` if the session exists and was deleted.
        console.log(status); // true

        return mysqlx.config.delete('<session_name>');
    })
    .then(status => {
        // Returns `true` if the session does not exist.
        console.log(status); // false
    });
```
