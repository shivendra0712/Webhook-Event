import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import { v4 as uuidv4 } from 'uuid';

const Event = sequelize.define('Event', {
    id: {
        type: DataTypes.STRING,
        defaultValue: () => uuidv4(),
        primaryKey: true,
    },
    eventType: {
        type: DataTypes.STRING,
        allowNull: false,
        index: true,
    },
    payload: {
        type: DataTypes.TEXT,
        allowNull: false,
        get() {
            const value = this.getDataValue('payload');
            return typeof value === 'string' ? JSON.parse(value) : value;
        },
        set(value) {
            this.setDataValue('payload', typeof value === 'string' ? value : JSON.stringify(value));
        },
    },
    idempotencyKey: {
        type: DataTypes.STRING,
        unique: 'idempotency_unique',
        allowNull: true,
        index: true,
        validate: {
            isUnique: async function(value) {
                if (value) {
                    const existing = await Event.findOne({
                        where: { idempotencyKey: value },
                        attributes: ['id']
                    });
                    if (existing && existing.id !== this.id) {
                        throw new Error('Idempotency key must be unique');
                    }
                }
            }
        }
    },
    status: {
        type: DataTypes.STRING,
        defaultValue: 'pending',
        index: true,
    },
    retryCount: {
        type: DataTypes.INTEGER,
        defaultValue: 0,
    },
    lastError: {
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
    tableName: 'events',
    timestamps: true,
});

export default Event;

