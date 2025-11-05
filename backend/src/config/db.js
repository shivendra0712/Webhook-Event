import { Sequelize } from 'sequelize';
import logger from '../utils/logger.js';
import path from 'path';
import { fileURLToPath } from 'url';


const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Use SQLite for development (no PostgreSQL needed)
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: path.join(__dirname, '../../webhook_relay.db'),
    logging: (msg) => logger.debug(msg),
    // Disable foreign key constraints for SQLite to allow table modifications
    foreignKeys: false,
});

export async function initializeDatabase() {
    try {
        await sequelize.authenticate();
        logger.info('Database connection established successfully');

        // Try normal sync first, if it fails, force recreate
        try {
            await sequelize.sync({ alter: false });
            logger.info('Database models synchronized');
        } catch (syncError) {
            logger.warn('Normal sync failed, recreating tables:', syncError.message);
            await sequelize.sync({ force: true });
            logger.info('Database tables recreated');
        }
    } catch (error) {
        logger.error('Unable to connect to the database:', error);
        throw error;
    }
}

export default sequelize;