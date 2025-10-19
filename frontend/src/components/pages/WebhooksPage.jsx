import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchWebhooks, createWebhook, deleteWebhook } from '../../store/slices/webhooksSlice';
import { fetchDeliveryStats } from '../../store/slices/deliveriesSlice';
import { Plus, Trash2, RefreshCw, Copy } from 'lucide-react';

const WebhooksPage = () => {
    const dispatch = useDispatch();
    const { webhooks, loading, error } = useSelector((state) => state.webhooks);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        url: '',
        eventTypes: '',
    });

    useEffect(() => {
        dispatch(fetchWebhooks({ limit: 50, offset: 0 }));
    }, [dispatch]);

    const handleCreateWebhook = async (e) => {
        e.preventDefault();
        const eventTypes = formData.eventTypes.split(',').map((t) => t.trim());
        await dispatch(
            createWebhook({
                name: formData.name,
                url: formData.url,
                eventTypes,
            })
        );
        // Refresh delivery stats after creating webhook
        dispatch(fetchDeliveryStats());
        setFormData({ name: '', url: '', eventTypes: '' });
        setShowForm(false);
    };

    const handleDelete = (id) => {
        if (confirm('Are you sure you want to delete this webhook?')) {
            dispatch(deleteWebhook(id));
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Webhooks</h2>
                    <p className="text-gray-600 mt-1">Manage webhook subscriptions</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => dispatch(fetchWebhooks({ limit: 50, offset: 0 }))}
                        className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                    >
                        <RefreshCw className="w-4 h-4" />
                        Refresh
                    </button>
                    <button
                        onClick={() => setShowForm(!showForm)}
                        className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                        <Plus className="w-4 h-4" />
                        Create Webhook
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Create New Webhook</h3>
                    <form onSubmit={handleCreateWebhook} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Name</label>
                            <input
                                type="text"
                                value={formData.name}
                                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., My Webhook"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">URL</label>
                            <input
                                type="url"
                                value={formData.url}
                                onChange={(e) => setFormData({ ...formData, url: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="https://example.com/webhook"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Event Types (comma-separated)</label>
                            <input
                                type="text"
                                value={formData.eventTypes}
                                onChange={(e) => setFormData({ ...formData, eventTypes: e.target.value })}
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., job.created, job.updated"
                                required
                            />
                        </div>
                        <div className="flex gap-2">
                            <button
                                type="submit"
                                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                            >
                                Create
                            </button>
                            <button
                                type="button"
                                onClick={() => setShowForm(false)}
                                className="px-4 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400"
                            >
                                Cancel
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    Error: {typeof error === 'string' ? error : JSON.stringify(error)}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">Loading webhooks...</p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {webhooks.map((webhook) => (
                        <div key={webhook.id} className="bg-white rounded-lg shadow p-6">
                            <div className="flex justify-between items-start">
                                <div className="flex-1">
                                    <h3 className="text-lg font-semibold text-gray-900">{webhook.name}</h3>
                                    <p className="text-gray-600 text-sm mt-1">{webhook.url}</p>
                                    <div className="mt-3 flex flex-wrap gap-2">
                                        {webhook.eventTypes.map((type) => (
                                            <span
                                                key={type}
                                                className="inline-flex px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800"
                                            >
                                                {type}
                                            </span>
                                        ))}
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => {
                                            navigator.clipboard.writeText(webhook.id);
                                            alert('Webhook ID copied!');
                                        }}
                                        className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg"
                                    >
                                        <Copy className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => handleDelete(webhook.id)}
                                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                    >
                                        <Trash2 className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default WebhooksPage;

