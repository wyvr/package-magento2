import { open_db, get_by_key, set_data, query_all, close_db } from './base';

let db;
let connection;

export const name = 'magento_customer';

export async function open() {
    const result = await open_db(
        db,
        connection,
        name,
        `CREATE TABLE IF NOT EXISTS "login" (
            key VARCHAR(255) NOT NULL PRIMARY KEY,
            value TEXT
        );
        CREATE TABLE IF NOT EXISTS "cart" (
            key VARCHAR(255) NOT NULL PRIMARY KEY,
            value TEXT
        );`
    );
    db = result?.db;
    connection = result?.connection;
    return db;
}

export async function close() {
    const result = await close_db(db, connection);
    db = result?.db;
    connection = result?.connection;
}

export async function get(name, key) {
    return await get_by_key(connection, name, key);
}

export async function set(name, key, value) {
    return await set_data(connection, name, {
        key,
        value: JSON.stringify(value)
    });
}

export async function query(name, query, ...params) {
    return await query_all(connection, name, query, ...params);
}

export async function run(name, query, ...params) {
    return await run_query(connection, name, query, ...params);
}
