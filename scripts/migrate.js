const fs = require('fs');
const path = require('path');
const logger = require('../logger');

/**
 * Basic migration runner
 * Note: For production use, a more robust library like knex or db-migrate is recommended.
 * This handles basic creation and seeding.
 */
async function runMigrations(dbPoolOrWrapper) {
    const migrationPath = path.join(__dirname, '../migrations/001_initial_schema.sql');
    try {
        let sql = fs.readFileSync(migrationPath, 'utf8');

        // Simple compatibility check: SQLite doesn't use SERIAL or TIMESTAMP (it uses INTEGER PRIMARY KEY and DATETIME)
        // However, standard PG SERIAL/TIMESTAMP often works in many wrappers or we can adjust here.
        if (process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite:')) {
            sql = sql.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
            sql = sql.replace(/TIMESTAMP/g, 'DATETIME');
            sql = sql.replace(/ON CONFLICT \(name\) DO NOTHING/g, ''); // SQLite INSERT OR IGNORE
            // SQLite specific tweaks if needed...
        }

        const queries = sql.split(';').filter(q => q.trim().length > 0);

        for (let query of queries) {
            try {
                // For SQLite INSERT OR IGNORE fallback
                if (sql.includes('clothing_categories') && query.includes('INSERT INTO')) {
                    const sqliteQuery = query.replace('INSERT INTO', 'INSERT OR IGNORE INTO');
                    await dbPoolOrWrapper.query(sqliteQuery);
                } else {
                    await dbPoolOrWrapper.query(query);
                }
            } catch (err) {
                // If it's a "table already exists" or "column already exists" error, we can often ignore
                if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                    continue;
                }
                logger.error(`Migration query failed: ${query.substring(0, 100)}...`, err);
            }
        }

        logger.info('Migrations completed successfully (initial schema).');
    } catch (err) {
        logger.error('Failed to run migrations:', err);
        throw err;
    }
}

module.exports = { runMigrations };
