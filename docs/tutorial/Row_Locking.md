The MySQL `SELECT` statement supports locking matching rows, for reads and for writes (`SELECT ... FOR UPDATE` or `SELECT ... LOCK IN SHARE MODE`). This also happens for the `Collection.find()` and `Table.select()` methods, which allow safe and transactional document/row updates on collections/tables by binding operations to a specific type of lock.

There are two types of locks. Shared locks - `lockShared()` - allow parallel transactions to consistently read from a given collection document or table row by waiting for uncommitted transactions with write operations. Parallel write operations will fail, unless there is no active transaction. Exclusive locks - `lockExclusive()` - on the other hand, allow parallel transactions to seamlessly and consistently both read from and write to a given collection document or table row.

Consider a collection `testSchema.testCollection` containing the following documents:

```json
[{
    "_id": "1",
    "a": 1
}, {
    "_id": "2",
    "a": 1
}, {
    "_id": "3",
    "a": 1
}]
```

The following scenarios apply when using row locks with the default mode (the same should be true when working with tables).

### Writing data in two sessions with exclusive locks

When two transactions are using exclusive locks, writes and updates from both of them will eventually be acknowledged even if they run (to completion) in parallel.

```js
const mysqlx = require('@mysql/xdevapi');

const result = [];
const samplesA = [];
const samplesB = [];

let sessionA, sessionB;

const transactionA = mysqlx.getSession('mysqlx://user@localhost:33060/schema')
    .then(session => {
        sessionA = session;

        return sessionA.startTransaction();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockExclusive()
            .execute(doc => samplesA.push(doc));
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .modify('_id = "1"')
            .set('a', samplesA[0].a + 1)
            .execute();
    })
    .then(() => {
        return sessionA.commit();
    });

const transactionB = mysqlx.getSession('mysqlx://user@localhost:33060/schema')
    .then(session => {
        sessionB = session;

        return sessionB.startTransaction();
    })
    .then(() => {
        return sessionB
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockExclusive()
            .execute(doc => samplesB.push(doc));
    })
    .then(() => {
        return sessionB
            .getSchema(config.schema)
            .getCollection('test')
            .modify('_id = "1"')
            .set('a', samplesB[0].a + 1)
            .set('b', 'foo')
            .execute();
    })
    .then(() => {
        return sessionB.commit();
    });

Promise
    .all([transactionA, transactionB])
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .execute(doc => result.push(doc));
    })
    .then(() => {
        console.log(result); // [{ _id: '1', a: 3, b: 'foo' }]
    });
```

### Writing data in two sessions with a shared lock and no active transaction

When two transactions are bound to the same shared lock, writes and updates from both of them will only eventually be acknowledged if they run (to completion) in series (one after the other).

```js
const mysqlx = require('@mysql/xdevapi');

const result = [];
const samplesA = [];
const samplesB = [];

let sessionA, sessionB;

mysqlx.getSession('mysqlx://user@localhost:33060/schema')
    .then(session => {
        sessionA = session;

        return sessionA.startTransaction();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared()
            .execute(doc => samplesA.push(doc));
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .modify('_id = "1"')
            .set('a', samplesA[0].a + 1)
            .execute();
    })
    .then(() => {
        return sessionA.commit();
    })
    .then(() => {
        return mysqlx.getSesssion('mysqlx://user@localhost:33060/schema');
    })
    .then(session => {
        sessionB = session;

        return sessionB.startTransaction();
    })
    .then(() => {
        return sessionB
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared()
            .execute(doc => samplesB.push(doc));
    })
    .then(() => {
        return sessionB
            .getSchema(config.schema)
            .getCollection('test')
            .modify('_id = "1"')
            .set('a', samplesB[0].a + 1)
            .set('b', 'foo')
            .execute();
    })
    .then(() => {
        return sessionB.commit();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .execute(doc => result.push(doc));
    })
    .then(() => {
        console.log(result); // [{ _id: '1', a: 3, b: 'foo' }]
    });
```

### Reading data in two sessions with a shared lock and an active transaction

When two transactions are bound to the same shared lock, if one of the transactions is not committed, reads from the other transaction will block until the first one gets committed.

```js
const mysqlx = require('@mysql/xdevapi');
const pTimeout = require('p-timeout');

const result = [];

let sessionA, sessionB;

mysqlx.getSesssion('mysqlx://user@localhost:33060/schema')
    .then(session => {
        sessionA = session;

        return sessionA.startTransaction();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared()
            .execute();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .modify('_id = "1"')
            .set('a', 2)
            .set('b', 'foo')
            .execute();
    })
    .then(() => {
        return mysqlx.getSesssion('mysqlx://user@localhost:33060/schema');
    })
    .then(session => {
        sessionB = session;

        return sessionB.startTransaction();
    })
    .then(() => {
        const read = sessionB
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared()
            .execute(doc => result.push(doc));

        // The read will block until the active transaction gets committed.
        return pTimeout(read, 2000);
    })
    .catch(err => {
        if (err.name !== 'TimeoutError') {
            throw err;
        }

        return sessionA.commit();
    })
    .then(() => {
        return sessionB.commit();
    })
    .then(() => {
        console.log(result); // [{ _id: '1', a: 2, b: 'foo' }]
    });
```

### Reading data in two sessions without any kind of lock

When two transactions are not bound to any kind of lock, if both write/update a given document, it will contain inconsistent data even after they get committed.

```js
const mysqlx = require('@mysql/xdevapi');

const result = [];

let sessionA, sessionB;

mysqlx.getSesssion('mysqlx://user@localhost:33060/schema')
    .then(session => {
        sessionA = session;

        return sessionA.startTransaction();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .execute();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .modify('_id = "1"')
            .set('a', 2)
            .set('b', 'foo')
            .execute();
    })
    .then(() => {
        return mysqlx.getSesssion('mysqlx://user@localhost:33060/schema');
    })
    .then(session => {
        sessionB = session;

        return sessionB.startTransaction();
    })
    .then(() => {
        return sessionB
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .execute(doc => result.push(doc));
    })
    .then(() => {
        return sessionA.commit();
    })
    .then(() => {
        return sessionB.commit();
    })
    .then(() => {
        console.log(result); // [{ _id: '1', a: 2, b: 'foo' }]
    });
```

### Writing data in two sessions with a shared lock and an active transaction

When two transactions are bound to the same shared lock, if one of the transactions is not committed, writes from the other transaction will fail with a deadlock error.

```js
const mysqlx = require('@mysql/xdevapi');

let sessionA, sessionB;

mysqlx.getSesssion('mysqlx://user@localhost:33060/schema')
    .then(session => {
        sessionA = session;

        return sessionA.startTransaction();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared()
            .execute();
    })
    .then(() => {
        return mysqlx.getSesssion('mysqlx://user@localhost:33060/schema');
    })
    .then(session => {
        sessionB = session;

        return sessionB.startTransaction();
    })
    .then(() => {
        return sessionB
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared()
            .execute();
    })
    .then(() => {
        return Promise.all([
            sessionA
                .getSchema(config.schema)
                .getCollection('test')
                .modify('_id = "1"')
                .set('a', 2)
                .execute(),
            sessionB
                .getSchema(config.schema)
                .getCollection('test')
                .modify('_id = "1"')
                .set('a', 3)
                .set('b', 'foo')
                .execute()
        ]);
    })
    .catch(err => {
        console.log(err.message); // 'Deadlock found when trying to get lock; try restarting transaction'
    });
```

## NOWAIT and SKIP LOCKED

The default behavior of row locks can be overridden using the `NOWAIT` and `SKIP LOCKED` [options](https://dev.mysql.com/doc/refman/8.0/en/innodb-locking-reads.html#innodb-locking-reads-nowait-skip-locked). These options are available through the `mysqlx.LockContention` property.

`NOWAIT` works similarly to the default mode when there isn't any ongoing transaction, whereas reads will fail when there is an ongoing transaction.

```js
const mysqlx = require('@mysql/xdevapi');

const result = [];

let sessionA, sessionB;

const sut = sessionA.startTransaction()
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared()
            .execute();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .modify('_id = "1"')
            .set('a', 2)
            .set('b', 'foo')
            .execute();
    })
    .then(() => {
        return sessionB.startTransaction();
    })
    .then(() => {
        return sessionB
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared(mysqlx.LockContention.NOWAIT)
            .execute(doc => result.push(doc));
    })
    .catch(err => {
        console.log(err.message); // 'Statement aborted because lock(s) could not be acquired immediately and NOWAIT is set.'
    });
```

`SKIP LOCKED` will allow reads, risking the chance of working with inconsistent data.

```js
const mysqlx = require('@mysql/xdevapi');

const result = [];

let sessionA, sessionB;

const sut = sessionA.startTransaction()
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared()
            .execute();
    })
    .then(() => {
        return sessionA
            .getSchema(config.schema)
            .getCollection('test')
            .modify('_id = "1"')
            .set('a', 2)
            .set('b', 'foo')
            .execute();
    })
    .then(() => {
        return sessionB.startTransaction();
    })
    .then(() => {
        return sessionB
            .getSchema(config.schema)
            .getCollection('test')
            .find('_id = "1"')
            .lockShared(mysqlx.LockContention.NOWAIT)
            .execute(doc => result.push(doc));
    })
    .then(() => {
        console.log(result); // []
    });
```
