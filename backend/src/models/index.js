import Event from './Event.js';
import Webhook from './Webhook.js';
import Delivery from './Delivery.js';

// Define associations
Event.hasMany(Delivery, { foreignKey: 'eventId', as: 'deliveries' });
Delivery.belongsTo(Event, { foreignKey: 'eventId', as: 'event' });

Webhook.hasMany(Delivery, { foreignKey: 'webhookId', as: 'deliveries' });
Delivery.belongsTo(Webhook, { foreignKey: 'webhookId', as: 'webhook' });

export { Event, Webhook, Delivery };

