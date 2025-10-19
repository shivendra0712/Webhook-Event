import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const Delivery = sequelize.define('Delivery', {
    id: {
        type: DataTypes.STRING,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    eventId: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true,
    },
    webhookId: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true,
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
        index: true,
    },
    httpStatus: {
        type: DataTypes.INTEGER,
        allowNull: true,
    },
    responseBody: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    responseHeaders: {
        type: DataTypes.TEXT,
        allowNull: true,
        get() {
            const value = this.getDataValue('responseHeaders');
            return value ? (typeof value === 'string' ? JSON.parse(value) : value) : null;
        },
        set(value) {
            this.setDataValue('responseHeaders', value ? (typeof value === 'string' ? value : JSON.stringify(value)) : null);
        },
    },
    retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    nextRetryAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    lastAttemptAt: {
        type: DataTypes.DATE,
        allowNull: true,
    },
    error: {
        type: DataTypes.TEXT,
        allowNull: true,
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
        index: true,
    },
    updatedAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW,
    },
}, {
    tableName: 'deliveries',
    timestamps: true,
});

export default Delivery;

