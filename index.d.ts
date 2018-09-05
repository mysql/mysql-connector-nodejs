// Definitions by: Chirag Shah <https://github.com/chiragshahklc>

export = MySqlx;
declare namespace MySqlx {
  /**
   * Locking modes.
   * @type {LockContention}
   * @const
   * @example
   * MySqlx.LockContention.NOWAIT
   * MySqlx.LockContention.SKIP_LOCKED
   */
  const LockContention: LockContention;

  /**
   * Database entity types.
   * @type {Mode}
   * @const
   * @example
   * MySqlx.Mode.TABLE
   * MySqlx.Mode.DOCUMENT
   */
  const Mode: Mode;

  /**
   * Parse an expression string into a Mysqlx.Expr.Expr.
   * @param {string} expr - expression string
   * @param {ParserOptions} options - additional options
   * @return {any} The protobuf encoded object.
   */
  function expr(expr: string, options: ParserOptions): any;

  /**
   * Additional parser options.
   */
  type ParserOptions = {
    mode?: any;
  };
  /**
   * Load a new or existing session.
   * @param {SessionOptions} options - session properties
   * @returns {Promise<Session>} Promise<Session>
   */
  function getSession(options: SessionOptions): Promise<Session>;
  /**
   * Load a new or existing session.
   * @param {string} connectionString - session properties
   * @returns {Promise<Session>} Promise<Session>
   */
  function getSession(connectionString: string): Promise<Session>;

  /**
   * Retrieve the connector version number (from package.json).
   * @return {String} string
   */
  function getVersion(): string;

  type LockContention = {
    NOWAIT: 1;
    SKIP_LOCKED: 2;
  };

  type Mode = {
    DOCUMENT: 1;
    TABLE: 2;
  };

  type SessionOptions = {
    host?: string;
    port?: number;
    user?: string;
    password?: string;
    auth?: string;
    socketFactory?: any; //
    ssl?: boolean;
    sslOptions?: any;
  };
  interface Session {
    /**
     * Close the server connection.
     * @returns {Promise} Promise<any>
     */
    close(): Promise<any>;

    /**
     * Commit a transaction
     *
     * This will commit a transaction on the server. On success the returned Promise will resolve to true,
     * else the Promise will be rejected with an Error.
     *
     * @returns {Promise<boolean>} Promise<boolean>
     */
    commit(): Promise<boolean>;

    /**
     * Connect to the database
     * @returns {Promise<Session>} Promise<Session> - Promise resolving to myself
     */
    connect(): Promise<Session>;

    /**
     * Create a schema in the database.
     * @param {string} schemaName - Name of the Schema
     * @returns {Promise<Schema>} Promise<Schema>
     */
    createSchema(schemaName: string): Promise<Schema>;

    /**
     * Drop a schema (without failing even if it does not exist).
     * @param {string} schemaName - schema name
     * @returns {Promise<boolean>} Promise<boolean> - Promise resolving to true on success
     */
    dropSchema(schemaName: string): Promise<boolean>;

    /**
     * Old NodeSession API.
     * Execute a raw SQL statement.
     * @param {string} sqlQuery - SQL statement
     * @param {...*} [args] - query placeholder values
     * @returns {SqlExecute} SqlExecute
     * @deprecated since version 8.0.12. Will be removed in future versions. Use {@link Session#sql|Session.sql()} instead.
     */
    executeSql(sqlQuery: string, ...args: Array<any>): SqlExecute;

    /**
     * Get the default schema instance.
     * @returns {Schema} Schema -  The default schema bound to the current session.
     */
    getDefaultSchema(): Schema;

    /**
     * Get instance of Schema object for a specific database schema
     *
     * This will always succeed, even if the schema doesn't exist. Use {@link Schema#existsInDatabase} on the returned
     * object to verify the schema exists.
     *
     * @param {string} schemaName - Name of the schema (database)
     * @returns {Schema} Schema
     */
    getSchema(schemaName: string): Schema;

    /**
     * Get schemas
     * @returns {Promise<Array<Schema>>} Promise<Array<Schema>> -  Promise resolving to a list of Schema instances.
     */
    getSchemas(): Promise<Array<Schema>>;

    /**
     * Release a transaction savepoint with the given name.
     *
     * @param {string} [savePointName] - savepoint name
     * @returns {Promise<any>} Promise<any>
     */
    releaseSavepoint(savePointName?: string): Promise<any>;

    /**
     * Rollback a transaction
     *
     * This will rollback the current transaction. On success the returned Promise will resolve to true,
     * else the Promise will be rejected with an Error.
     * Create a Schema in the database
     *
     * @returns {Promise<boolean>} Promise<boolean>
     */
    rollback(): Promise<boolean>;

    /**
     * Rollback to a transaction savepoint with the given name.
     *
     * @param {string} [savePointName] - savepoint name
     * @returns {Promise<any>} Promise<any>
     */
    rollbackTo(savePointName?: string): Promise<any>;

    /**
     * Create a new transaction savepoint. If a name is not provided, one will be
     * generated using the connector-nodejs-<random-prefix> format.
     *
     * @param {string} [savePointName] - savepoint name
     * @returns {Promise<string>} Promise<string> - Promise that resolves to the name of the savepoint.
     */
    setSavepoint(savePointName?: string): Promise<string>;

    /**
     * Execute a raw SQL statement.
     * @param {string} sqlQuery - SQL statement
     * @returns {SqlExecute} SqlExecute
     */
    sql(sqlQuery: string): SqlExecute;

    /**
     * Start a transaction
     *
     * This will start a transaction on the server. On success the returned Promise will resolve to true,
     * else the Promise will be rejected with an Error.
     *
     * @returns {Promise<boolean>} Promise<boolean>
     */
    startTransaction(): Promise<boolean>;
    //Not available in official documentation. https://dev.mysql.com/doc/dev/connector-nodejs/8.0/Session.html
    insepct(): Object;
  }
  interface Schema {
    /**
     * Create a new collection in the schema.
     * @param {string} collectionName - collection name
     * @param {CreateCollectionOptions} [options] - setup options
     * @returns {Promise<Collection>} Promise<Collection>
     */
    createCollection(
      collectionName: string,
      options?: CreateCollectionOptions
    ): Promise<Collection>;

    /**
     * Drop a collection from the schema (without failing even if the collection does not exist).
     * @param {string} collectionName - collection name
     * @returns {Promise<boolean>} Promise<boolean>
     */
    dropCollection(collectionName: string): Promise<boolean>;

    /**
     * Check if this schema exists in the database.
     * @returns {Promise<boolean>} Promise<boolean>
     */
    existsInDatabase(): Promise<boolean>;

    /**
     * Retrieve the class name (to avoid duck typing).
     * @returns {string} string - The "class" name.
     */
    getClassName(): string;

    /**
     * Retrieve the instance of a given collection.
     * @param {string} collectionName - collection name
     * @returns {Collection} Collection
     */
    getCollection(collectionName: string): Collection;

    /**
     * Retrieve the instance of a given table or named collection.
     * @param {string} name - collection name
     * @returns {module:Table}
     */
    getCollectionAsTable(collectionName: string): Table;

    /**
     * Retrieve the list of collections that exist in the schema.
     * @returns {Promise<Array<Collection>>} Promise<Array<Collection>> - A promise that resolves to the array of collection instances.
     */
    getCollections(): Promise<Array<Collection>>;

    /**
     * Retrieve the schema name.
     * @returns {string} string
     */
    getName(): string;

    /**
     * Retrieve the instance of a given table.
     * @param {string} tableName - table name
     * @returns {module:Table}
     */
    getTable(tableName: string): Table;

    /**
     * Retrieve the list of tables that exist in the schema.
     * @returns {Promise<Array<Table>>} Promise<Array<Table>> - A promise that resolves to the array of table instances.
     */
    getTables(): Promise<Array<Table>>;

    /**
     * Retrieve the schema metadata.
     * @returns {Object} Object - An object containing the relevant metadata.
     */
    inspect(): Object;
  }

  type CreateCollectionOptions = {
    ReuseExistingObject?: boolean;
  };

  interface SqlExecute {
    /**
     * Bind values to ordinal query placeholders.
     * @param {...any} args - one or more values to bind
     * @returns {SqlExecute} SqlExecute - The query instance.
     * @example
     * // values as arguments
     * const query = session.sql('SELECT FROM person WHERE name = ? AND age = ?').bind('foo', 23)
     * // values as a single array argument
     * const query = session.sql('SELECT FROM person WHERE name = ? AND age = ?').bind(['foo', 23])
     */
    bind(...args: Array<any>): SqlExecute;

    /**
     * Execute a raw SQL query.
     * @param {rowCallback} rowcb - Callback function to handle results, or an object with both callback functions.
     * @param {metadataCallback} [metacb] - Callback function to handle metadata.
     * @example
     * // provide only a callback to handle results
     * query.execute(result => {})
     * query.execute({ result () {} })
     *
     * // provide only a callback to handle metadata
     * query.execute({ meta () {} })
     *
     * // provide callbacks to handle results and metadata
     * query.execute(result => {}, meta => {})
     * query.execute({ result () {}, meta () {} })
     * @returns {Promise<any>} Promise<any>
     */
    execute(
      rowcb: (items: Array<any>) => any,
      metacb?: (metadata: Array<Object>) => any
    ): Promise<any>;

    /**
     * Retrieve the class name (to avoid duck typing).
     * @private
     * @returns {string} string - The "class" name.
     */
    getClassName(): string;
  }

  interface StatementType {
    CLASSIC: "sql";
    X_PLUGIN: "mysqlx";
  }

  interface Collection {
    /**
     * Create an operation to add one or more documents to the collection.
     * @param {...Object | JSON} args - object with document data
     * @returns {CollectionAdd} CollectionAdd - The operation instance.
     * @throws {Error} When the input type is invalid.
     * @example
     * // arguments as single documents
     * collection.add({ foo: 'baz' }, { bar: 'qux' })
     */
    add(...args: Array<Object | JSON>): CollectionAdd;

    /**
     * Create an operation to add one or more documents to the collection.
     * @param {Array<Object | JSON>} args - object with document data
     * @returns {CollectionAdd} CollectionAdd - The operation instance.
     * @throws {Error} When the input type is invalid.
     * @example
     * // array of documents
     * collection.add([{ foo: 'baz' }, { bar: 'qux' }])
     */
    add(args: Array<Object | JSON>): CollectionAdd;

    /**
     * Create or replace a document with the given id.
     * @param {string} documentId - document id
     * @param {Object} documentProperties - document properties
     * @returns {Promise<Result>} Promise<Result> - A promise that resolves to the operation result.
     * @example
     * collection.addOrReplaceOne('foo', { prop1: 'bar', prop2: 'baz' })
     */
    addOrReplaceOne(
      documentId: string,
      documentProperties: Object
    ): Promise<Result>;

    /**
     * Retrieve the total number of documents in the collection.
     * @returns {Promise<number>} Promise<number>
     * @deprecated since version 8.0.12. Will be removed in future versions.
     */
    count(): Promise<number>;

    /**
     * Create a new index.
     * @param {string} name - index name
     * @param {IndexDefinition} constraint - index definition
     * @returns {Promise<boolean>} Promise<boolean>
     */
    createIndex(
      indexName: string,
      constraint: IndexDefinition
    ): Promise<boolean>;

    /**
     * Drop an Index on a Collection given a name.
     * @param {string} indexName - Index name
     * @returns {Promise<boolean>} Promise<boolean>
     */
    dropIndex(indexName: string): Promise<boolean>;

    /**
     * Check if this collection exists in the database.
     * @returns {Promise<boolean>} Promise<boolean>
     */
    existsInDatabase(): Promise<boolean>;

    /**
     * Create an operation to find documents in the collection.
     * @param {SearchConditionStr} expr - filtering criteria
     * @returns {CollectionFind} CollectionFind - The operation instance.
     */
    find(expr: SearchConditionStr): CollectionFind;

    /**
     * Retrieve the collection name.
     * @returns {string} string
     */
    getName(): string;

    /**
     * Retrieve a single document with the given id.
     * @param {string} documentId - document id
     * @returns {Object} Object - The document instance.
     * @example
     * collection.getOne('1')
     */
    getOne(documentId: string): Object;

    /**
     * Retrieve the schema associated to the collection.
     * @returns {Schema} Schema
     */
    getSchema(): Schema;

    /**
     * Retrieve the collection metadata.
     * @returns {Object} Object - An object containing the relevant metadata.
     */
    inspect(): Object;

    /**
     * Create an operation to modify documents in the collection.
     * @param {SearchConditionStr} expr - filtering criteria
     * @returns {CollectionModify} CollectionModify - The operation instance.
     * @example
     * // update all documents in a collection
     * collection.modify('true').set('name', 'bar')
     * // update documents that match a given condition
     * collection.modify('name = "foo"').set('name', 'bar')
     */
    modify(expr: SearchConditionStr): CollectionModify;

    /**
     * Create an operation to remove documents from the collection.
     * @param {SearchConditionStr} expr - filtering criteria
     * @returns {CollectionRemove} CollectionRemove - The operation instance.
     * @example
     * // remove all documents from a collection
     * collection.remove('true')
     * // remove documents that match a given condition
     * collection.remove('name = "foobar"')
     */
    remove(expr: SearchConditionStr): CollectionRemove;

    /**
     * Remove a single document with the given id.
     * @param {string} documentId - document id
     * @returns {Promise<Result>} Promise<Result> - A promise that resolves to the operation result.
     * @example
     * collection.removeOne('1')
     */
    removeOne(documentId: string): Promise<Result>;

    /**
     * Replace an entire document with a given id.
     * @param {string} documentId - document id
     * @param {Object} documentProperties - document properties
     * @returns {Promise<Result>} Promise<Result> - A promise that resolves to the operation result.
     * @example
     * collection.replaceOne('foo', { prop1: 'bar', prop2: 'baz' })
     */
    replaceOne(documentId: string, documentProperties: Object): Promise<Result>;
  }

  type IndexDefinition = {
    type?: string;
    fileds: Array<FieldDefinition>;
  };

  type FieldDefinition = {
    field: string;
    type: string;
    required?: boolean;
    options?: number;
    srid?: number;
  };

  type SearchConditionStr = string;

  interface CollectionAdd {
    /**
     * Create query to add one or various documents.
     * @param {...Object} input - document or list of documents
     * @returns {CollectionAdd} CollectionAdd - The query instance.
     * @throws {Error} When the input type is invalid.
     * @example
     * // arguments as single documents
     * collection.add({ foo: 'baz' }).add({ bar: 'qux' }, { biz: 'quux' })
     */
    add(...input: Array<Object>): CollectionAdd;

    /**
     * Create query to add one or various documents.
     * @param {Array<Object>} input - document or list of documents
     * @returns {CollectionAdd} CollectionAdd - The query instance.
     * @throws {Error} When the input type is invalid.
     * @example
     * // array of documents
     * collection.add([{ foo: 'baz' }]).add([{ bar: 'qux' }, { biz: 'quux' }])
     */
    add(input: Array<Object>): CollectionAdd;

    /**
     * Run the query to save the documents to the collection in the database.
     * If a document does not contain an <code>_id</code>, it will be assigned a UUID-like value.
     * @returns {Promise<Result>} Promise<Result>
     */
    execute(): Promise<Result>;

    //
    /**
     * Retrieve the class name (to avoid duck typing).
     * @private
     * @returns {string} string - The "class" name.
     */
    getClassName(): string;
  }
  type CollectionAddOptions = {
    upsert: boolean;
  };
  interface CollectionFind {
    execute(rowcb?: (result: any) => any): Promise<Result>;
    fields(projections: string | Array<string>): CollectionFind;
    //
    getClassName(): string;
  }
  interface CollectionModify {
    /**
     * Append element to an array field.
     * @param {string} field - document array field
     * @param {*} value - value to append
     * @returns {CollectionModify} CollectionModify - The query instance.
     */
    arrayAppend(field: string, value: any): CollectionModify;

    /**
     * Delete element from an array.
     * @param {string} field - document array field
     * @returns {CollectionModify} CollectionModify - The query instance
     * @deprecated since version 8.0.12. Will be removed in future versions. Use {@link |CollectionModify.unset()} instead.
     */
    arrayDelete(field: string): CollectionModify;

    /**
     * Insert element into an array field.
     * @param {string} field - document array field
     * @param {*} value - value to insert
     * @returns {CollectionModify} CollectionModify - The query instance.
     */
    arrayInsert(field: string, value: any): CollectionModify;

    /**
     * Execute modify operation.
     * @return {Promise<Result>} Promise<Result>
     */
    execute(): Promise<Result>;

    /**
     * Retrieve the class name (to avoid duck typing).
     * @returns {string} string - The "class" name.
     */
    getClassName(): string;

    /**
     * Update multiple document properties.
     * @param {Object} properties - properties to update
     * @return {CollectionModify} CollectionModify - The query instance.
     */
    patch(properties: Object): CollectionModify;

    /**
     * Set the value of a given document field.
     * @param {string} field - document field
     * @param {*} value -  value to assign
     * @returns {CollectionModify} CollectionModify - The query instance.
     */
    set(field: string, value: any): CollectionModify;

    /**
     * Unset the value of document fields.
     * @param {(string|string[])} fields
     * @returns {CollectionModify} CollectionModify - The query instance.
     */
    unset(fields: string | Array<string>): CollectionModify;
  }
  interface CollectionRemove {
    /**
     * Execute remove query.
     * @return {Promise<Result>}
     */
    execute(): Promise<Result>;

    /**
     * Retrieve the class name (to avoid duck typing).
     * @private
     * @returns {string} string - The "class" name.
     */
    getClassName(): string;
  }
  interface Result {
    /**
     * Retrieve the number of documents affected by the operation.
     * @returns {number} number - The number of documents.
     */
    getAffectedItemsCount(): number;

    /**
     * Retrieve the number of rows affected by the operation.
     * @returns {number} number - The number of rows.
     */
    getAffectedRowsCount(): number;

    /**
     * Retrieve the first <code>AUTO INCREMENT</code> value generated by the operation.
     * @returns {number} number - The first value.
     */
    getAutoIncrementValue(): number;

    /**
     * Retrieve the list of server-side generated document ids.
     * @returns {string[]} Array<string> - The list of ids.
     */
    getGeneratedIds(): Array<string>;

    /**
     * Retrieve the list of warnings generated on the server.
     * @returns {Array<Warning>} Array<Warning> - The list of warning objects
     */
    getWarnings(): Array<Warning>;

    /**
     * Retrieve the number of warnings generated on the server.
     * @returns {number} The number of warnings.
     */
    getWarningsCount(): number;
  }

  type Warning = {
    level: number;
    code: number;
    msg: string;
  };

  interface Table {
    /**
     * @deprecated since version 8.0.12. Will be removed in future versions.
     */
    count(): Promise<number>;
    delete(expr?: SearchConditionStr): TableDelete;
    existsInDatabase(): Promise<boolean>;
    getName(): string;
    getSchema(): Schema;
    insert(fields: Object | Array<string>): TableInsert;
    insert(...fields: Array<string>): TableInsert;
    inspect(): Object;
    isView(): Promise<boolean>;
    select(expr: Array<string>): TableSelect;
    select(...expr: Array<string>): TableSelect;
    update(expr?: string): TableUpdate;
  }

  interface TableDelete {
    /**
     * Execute delete query.
     * @return {Promise<Result>} Promise<Result>
     */
    execute(): Promise<Result>;

    //
    /**
     * Retrieve the class name (to avoid duck typing).
     * @private
     * @returns {string} string - The "class" name.
     */
    getClassName(): string;
  }

  interface TableInsert {
    /**
     * Execute the insert query.
     * @returns {Promise<Result>} Promise<Result>
     */
    execute(): Promise<Result>;

    /**
     * Set row values.
     * @param {...string} ExprOrLiteral - column values
     * @returns {TableInsert} TableInsert - The query instance
     * @example
     * // arguments as column values
     * table.insert('foo', 'bar').values('baz', 'qux')
     * table.insert(['foo', 'bar']).values('baz', 'qux')
     *
     */
    values(...ExprOrLiteral: Array<string>): TableInsert;

    /**
     * Set row values.
     * @param {string[]} ExprOrLiteral - column values
     * @returns {TableInsert} TableInsert - The query instance
     * @example
     * // array of column values
     * table.insert('foo', 'bar').values(['baz', 'qux'])
     * table.insert(['foo', 'bar']).values(['baz', 'qux'])
     */
    values(ExprOrLiteral: Array<string>): TableInsert;

    //
    /**
     * Retrieve the class name (to avoid duck typing).
     * @private
     * @returns {string} string - The "class" name.
     */
    getClassName(): string;
  }
  interface TableSelect {
    /**
     * Execute the find query.
     * @param {rowCallback} [rowcb]
     * @param {metadataCallback} [metacb]
     * @return {Promise<Result>} Promise<Result>
     */
    execute(
      rowcb?: (items: Array<any>) => any,
      metacb?: (metadata: Array<Object>) => any
    ): Promise<Result>;

    /**
     * Build a view for the query.
     * @returns {string} string - The view SQL string.
     */
    getViewDefinition(): string;

    //
    /**
     * Retrieve the class name (to avoid duck typing).
     * @private
     * @returns {string} string The "class" name.
     */
    getClassName(): string;
  }
  interface TableUpdate {
    /**
     * Execute update query.
     * @return {Promise<Result>} Promise<Result>
     */
    execute(): Promise<Result>;

    /**
     * Retrieve the class name (to avoid duck typing).
     * @returns {string} string - The "class" name.
     */
    getClassName(): string;

    /**
     * Add a field to be updated with a new value.
     * @param {string} field - field name
     * @param {string} valueExpression - value expression
     * @returns {TableUpdate} TableUpdate - The query instance.
     */
    set(field: string, valueExpression: string): TableUpdate;
  }
}
