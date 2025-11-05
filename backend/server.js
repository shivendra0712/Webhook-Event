import dotenv from 'dotenv';
import app from './src/app.js';
import { initializeDatabase } from './src/config/db.js';
import logger from './src/utils/logger.js';

dotenv.config({ debug: false });

const port = process.env.PORT || 4000;

// Initialize database and start server
async function startServer() {
    try {
        await initializeDatabase();
        logger.info('Database initialized successfully');

        app.listen(port, () => {
            logger.info(`Server is running on http://localhost:${port}`);
        });
    } catch (error) {
        logger.error('Failed to start server:', error);
        process.exit(1);
    }
}


startServer();







