const fs = require('fs');
const path = require('path');
const logger = require('../logger');

/**
 * Basic migration runner
 * Note: For production use, a more robust library like knex or db-migrate is recommended.
 * This handles basic creation and seeding.
 */
async function runMigrations(dbPoolOrWrapper) {
    const migrationsDir = path.join(__dirname, '../migrations');
    try {
        const files = fs.readdirSync(migrationsDir).filter(f => f.endsWith('.sql')).sort();

        for (const file of files) {
            logger.info(`Running migration: ${file}`);
            const migrationPath = path.join(migrationsDir, file);
            let sql = fs.readFileSync(migrationPath, 'utf8');

            const isSqlite = process.env.DATABASE_URL && process.env.DATABASE_URL.startsWith('sqlite:');

            // Simple compatibility check: SQLite doesn't use SERIAL or TIMESTAMP
            if (isSqlite) {
                sql = sql.replace(/SERIAL PRIMARY KEY/g, 'INTEGER PRIMARY KEY AUTOINCREMENT');
                sql = sql.replace(/TIMESTAMP/g, 'DATETIME');
                sql = sql.replace(/TEXT\[\]/g, 'TEXT');
                sql = sql.replace(/ON CONFLICT \(name\) DO NOTHING/g, '');
            }

            const queries = sql.split(';').filter(q => q.trim().length > 0);

            for (let query of queries) {
                try {
                    let execQuery = query.trim();

                    // Skip PostgreSQL-only statements for SQLite
                    if (isSqlite) {
                        // Skip ALTER COLUMN statements (SQLite doesn't support them well)
                        if (execQuery.includes('ALTER COLUMN') || execQuery.includes('ALTER TABLE') && execQuery.includes('DROP NOT NULL')) {
                            logger.info(`Skipping PostgreSQL-only statement: ${execQuery.substring(0, 60)}...`);
                            continue;
                        }
                        // Skip COMMENT ON statements
                        if (execQuery.startsWith('COMMENT ON')) {
                            logger.info(`Skipping COMMENT statement for SQLite`);
                            continue;
                        }
                        // For SQLite INSERT OR IGNORE fallback
                        if (sql.includes('clothing_categories') && execQuery.includes('INSERT INTO')) {
                            execQuery = execQuery.replace('INSERT INTO', 'INSERT OR IGNORE INTO');
                        }
                    }

                    await dbPoolOrWrapper.query(execQuery);
                } catch (err) {
                    if (err.message.includes('already exists') || err.message.includes('duplicate')) {
                        continue;
                    }
                    logger.error(`Migration query failed in ${file}: ${query.substring(0, 100)}...`, err);
                }
            }
        }

        logger.info('All migrations completed successfully.');
    } catch (err) {
        logger.error('Failed to run migrations:', err);
        throw err;
    }
}

module.exports = { runMigrations };
