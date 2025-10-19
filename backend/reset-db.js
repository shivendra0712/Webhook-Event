import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dbPath = path.join(__dirname, 'webhook_relay.db');

try {
    if (fs.existsSync(dbPath)) {
        fs.unlinkSync(dbPath);
        console.log('Database file deleted successfully');
    } else {
        console.log('Database file does not exist');
    }
} catch (error) {
    console.error('Error deleting database file:', error.message);
}