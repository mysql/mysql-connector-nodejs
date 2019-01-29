There is no explicit API to create and/or use prepared statements. Connector/Node.js will handle that autonomously once it understands that a statement with the same scope is being executed multiple times.

Currently, this happens for the following operations:

- {@link module:CollectionFind|CollectionFind}
- {@link module:CollectionModify|CollectionModify}
- {@link module:CollectionRemove|CollectionRemove}
- {@link module:TableSelect|TableSelect}
- {@link module:TableUpdate|TableUpdate}
- {@link module:TableDelete|TableDelete}

The scope of the statement is defined by existing invariants such as projection and aggregation boundaries. On the other hand, things like assigning new values to existing statement placeholders for things like filtering criteria or limiting and skipping records will not change the scope of a statement that has been previously prepared.

The entire statement state (apart from an identifier that is used to match the given statement in the server) is kept on the client, which means that for enabling autonomous prepared staments, you have to rely on the same statement instance within your application.

In a nutshell, a statement has the lifecycle described below:

```js
const stmt = collection.find('_id = :id');

stmt.bind('id', 1).execute()                    // executes a plain CRUD operation
    .then(() => stmt.bind('id', 2).execute())   // prepares a statement and executes it
    .then(() => stmt.bind('id', 3).execute())   // executes the existing prepared statement
    .then(() => stmt.limit(10).execute())       // deallocates the existing statement, prepares a new one and executes it
    .then(() => stmt.offset(2).execute())       // executes the existing prepared statement
    .then(() => stmt.fields('name').execute())  // deallocates the existing statement and executes a plain CRUD operation
    .then(() => stmt.bind('id', 4).execute())   // prepares a statement and executes it
    .then(() => stmt.offset(1).execute())       // executes the existing prepared statement
    .then(() => stmt.sort('name').execute())    // deallocates the existing statement and executes a plain CRUD operation
```

### Caveats

Since you operate on the same statement instance, you need to be extra carefull with [`Promise.all()`](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise/all), which executes each thenable in parallel, meaning it will lead to race conditions when determining the current stage in the statement lifecycle.

To avoid these race conditions, the client-side state only gets updated when there is server feedback. To provide compatibility with older MySQL and X Plugin servers (without support for X Protocol prepared statements), when the client tries to prepare a statement, it checks for a specific error message, that needs to be accounted for, in order to avoid any attempts of preparing any further statements in the given session, and the respective extra server round-trips.

This means that each thenable executed by `Promise.all()` will have the same initial state and will be treated according to a single corresponding lifecycle stage.

However, there is still the risk of leaving the application and the MySQL server in an inconsistent state, for instance, when a statement has been executed once, executing it again **n** times using `Promise.all()` will create **n** prepared statements which won't be able to be deallocated (until the session is closed) and will clog up server resources.

```js
const stmt = collection.find()

Promise.all([stmt.execute(), stmt.execute()])                                                 // executes a plain CRUD operation twice
    .then(() => Promise.all([stmt.execute(), stmt.execute()]))                                // prepares two statements and executes the latter twice
    .then(() => Promise.all([stmt.execute(), stmt.execute()]))                                // executes the last statement twice
    .then(() => Promise.all([stmt.fields('foo').execute(), stmt.fields('bar').execute()]))    // deallocates only the last statement
```

Additionally, running thenables that lead to using existing a prepared statement and at the same, running other that deallocates that same statement will also not work.

```js
const stmt = collection.find()

Promise.all([stmt.execute(), stmt.execute()])
    .then(() => Promise.all([stmt.execute(), stmt.execute()]))
    .then(() => Promise.all([stmt.execute(), stmt.execute()]))
    .then(() => Promise.all([stmt.fields('foo').execute(), stmt.execute()])) // Server error on the 2nd call, since the state is still not up-to-date and the client will try to execute the prepared statement
```

So, since the statement lifecycle enforces a natural order, the behavior is incompatible (or leads to a lot of inconsistencies) with `Promise.all()`. There is, however, a fair use of the API, which is when you are certain the statement was already prepared and you just want to execute it over and over.

```js
const stmt = collection.find()

stmt.execute()                                                  // executes a plain CRUD operation
    .then(() => stmt.execute())                                 // prepares a statement and executes it
    .then(() => Promise.all([stmt.execute(), stmt.execute()]))  // executes the prepared statement twice
    .then(() => stmt.fields('foo').execute())                   // deallocates the existing statement and executes a plain CRUD operation
```

