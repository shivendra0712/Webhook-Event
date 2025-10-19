import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEvents, createEvent } from '../../store/slices/eventsSlice';
import { Plus, RefreshCw } from 'lucide-react';

const EventsPage = () => {
    const dispatch = useDispatch();
    const { events, loading, error } = useSelector((state) => state.events);
    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        eventType: '',
        payload: '{}',
        idempotencyKey: '',
    });

    useEffect(() => {
        dispatch(fetchEvents({ limit: 50, offset: 0 }));
    }, [dispatch]);

    const handleCreateEvent = async (e) => {
        e.preventDefault();
        try {
            const payload = JSON.parse(formData.payload);
            await dispatch(
                createEvent({
                    eventType: formData.eventType,
                    payload,
                    idempotencyKey: formData.idempotencyKey || undefined,
                })
            );
            setFormData({ eventType: '', payload: '{}', idempotencyKey: '' });
            setShowForm(false);
        } catch (err) {
            alert('Invalid JSON payload');
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Events</h2>
                    <p className="text-gray-600 mt-1">Manage and monitor system events</p>
                </div>
                <div className="flex gap-2">
                    <button
                        onClick={() => dispatch(fetchEvents({ limit: 50, offset: 0 }))}
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
                        Create Event
                    </button>
                </div>
            </div>

            {showForm && (
                <div className="bg-white rounded-lg shadow p-6">
                    <h3 className="text-lg font-semibold mb-4">Create New Event</h3>
                    <form onSubmit={handleCreateEvent} className="space-y-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Event Type</label>
                            <input
                                type="text"
                                value={formData.eventType}
                                onChange={(e) =>
                                    setFormData({ ...formData, eventType: e.target.value })
                                }
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="e.g., job.created"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Payload (JSON)</label>
                            <textarea
                                value={formData.payload}
                                onChange={(e) =>
                                    setFormData({ ...formData, payload: e.target.value })
                                }
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 font-mono text-sm"
                                rows="4"
                                required
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700">Idempotency Key (Optional)</label>
                            <input
                                type="text"
                                value={formData.idempotencyKey}
                                onChange={(e) =>
                                    setFormData({ ...formData, idempotencyKey: e.target.value })
                                }
                                className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                                placeholder="Unique key for idempotency"
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
                    <p className="text-gray-600">Loading events...</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Event Type</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Created At</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {events.map((event) => (
                                <tr key={event.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">{event.eventType}</td>
                                    <td className="px-6 py-4 text-sm">
                                        <span
                                            className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${
                                                event.status === 'completed'
                                                    ? 'bg-green-100 text-green-800'
                                                    : event.status === 'failed'
                                                    ? 'bg-red-100 text-red-800'
                                                    : 'bg-yellow-100 text-yellow-800'
                                            }`}
                                        >
                                            {event.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {new Date(event.createdAt).toLocaleString()}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
};

export default EventsPage;

