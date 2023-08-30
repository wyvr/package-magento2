import { Logger } from '@wyvr/generator/src/utils/logger.js';
import { Storage } from '@wyvr/generator/src/utils/storage.js';
import { filled_string, is_string, filled_object } from '@wyvr/generator/src/utils/validate.js';
import { create_dir } from '@wyvr/generator/src/utils/file.js';

import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

export async function open_db(db, connection, name, sql_create_table) {
    if (db && db.exists && db.connected) {
        return { db, connection };
    }
    db = Storage.details(name);

    if (db.exists && db.connected) {
        return { db, connection };
    }

    if (!db.exists) {
        create_dir(db.path);
    }
    try {
        // save and store the connection
        connection = await open({
            filename: db.path,
            driver: sqlite3.Database,
        });

        // tables
        if (filled_string(sql_create_table)) {
            await connection.exec(sql_create_table);
        }
    } catch (error) {
        Logger.error(error, name, db);
        return undefined;
    }
    return { db, connection };
}

export async function close_db(db, connection) {
    try {
        if (connection) {
            await connection.close();
            connection = undefined;
        }
    } catch (e) {
        Logger.debug(db, e);
    }
    if (db) {
        db.connected = false;
    }
    return { db, connection };
}

export function validate(connection, name) {
    if (!connection) {
        Logger.error('no connection available, please open connection first e.g. await open()');
        return undefined;
    }
    const db_name = sanitize(name);
    if (!db_name) {
        Logger.error('name is not set or invalid');
        return undefined;
    }
    return db_name;
}

export function sanitize(name) {
    if (!is_string(name)) {
        return undefined;
    }
    return name.replace(/(^a-zA-Z0-9)/g, '');
}

export async function get_by_key(connection, name, key) {
    const db_name = validate(connection, name);
    if (!db_name) {
        return;
    }
    const result = await connection.get(`SELECT * from "${db_name}" WHERE key=?;`, key);
    return result;
}

export async function set_data(connection, name, data) {
    const db_name = validate(connection, name);
    if (!db_name || !filled_object(data)) {
        return false;
    }
    const values = [];
    const keys = [];
    const placeholder = [];
    Object.entries(data).forEach(([key, value]) => {
        keys.push(key);
        values.push(value);
        placeholder.push('?');
    });
    await connection.run(
        `INSERT OR REPLACE INTO "${db_name}" (${keys.join(',')}) VALUES (${placeholder.join(',')});`,
        ...values
    );
    return true;
}

export async function query_all(connection, name, query, ...params) {
    const db_name = validate(connection, name);
    if (!db_name) {
        return;
    }
    const result = await connection.all(query, ...params);
    return result;
}

export async function run_query(connection, name, query, ...params) {
    const db_name = validate(connection, name);
    if (!db_name) {
        return;
    }
    return await connection.run(query, ...params);
}
