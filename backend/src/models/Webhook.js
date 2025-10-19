 import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const Webhook = sequelize.define('Webhook', {
    id: {
        type: DataTypes.STRING,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    name: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    url: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
            isUrl: true,
        },
    },
    eventTypes: {
        type: DataTypes.TEXT,
        allowNull: false,
        defaultValue: '[]',
        get() {
            const value = this.getDataValue('eventTypes');
            return typeof value === 'string' ? JSON.parse(value) : value;
        },
        set(value) {
            this.setDataValue('eventTypes', typeof value === 'string' ? value : JSON.stringify(value));
        },
    },
    secret: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    isActive: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
        index: true,
    },
    headers: {
        type: DataTypes.TEXT,
        defaultValue: '{}',
        get() {
            const value = this.getDataValue('headers');
            return typeof value === 'string' ? JSON.parse(value) : value;
        },
        set(value) {
            this.setDataValue('headers', typeof value === 'string' ? value : JSON.stringify(value));
        },
    },
    retryPolicy: {
        type: DataTypes.TEXT,
        defaultValue: JSON.stringify({
            maxRetries: 5,
            initialDelayMs: 1000,
            backoffMultiplier: 2,
            maxDelayMs: 60000,
        }),
        get() {
            const value = this.getDataValue('retryPolicy');
            return typeof value === 'string' ? JSON.parse(value) : value;
        },
        set(value) {
            this.setDataValue('retryPolicy', typeof value === 'string' ? value : JSON.stringify(value));
        },
    },
    clientId: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'webhooks',
    timestamps: true,
});

export default Webhook;

