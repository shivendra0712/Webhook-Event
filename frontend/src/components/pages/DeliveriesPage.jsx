import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchDeliveries, retryDelivery } from '../../store/slices/deliveriesSlice';
import { RefreshCw, RotateCcw } from 'lucide-react';

const DeliveriesPage = () => {
    const dispatch = useDispatch();
    const { deliveries, loading, error } = useSelector((state) => state.deliveries);
    const [filter, setFilter] = useState('');

    useEffect(() => {
        dispatch(fetchDeliveries({ limit: 50, offset: 0 }));
    }, [dispatch]);

    const handleRetry = (id) => {
        dispatch(retryDelivery(id));
    };

    const filteredDeliveries = filter
        ? deliveries.filter((d) => d.status === filter)
        : deliveries;

    const getStatusColor = (status) => {
        switch (status) {
            case 'delivered':
                return 'bg-green-100 text-green-800';
            case 'failed':
                return 'bg-red-100 text-red-800';
            case 'retrying':
                return 'bg-yellow-100 text-yellow-800';
            case 'pending':
                return 'bg-blue-100 text-blue-800';
            default:
                return 'bg-gray-100 text-gray-800';
        }
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Deliveries</h2>
                    <p className="text-gray-600 mt-1">Monitor webhook delivery status</p>
                </div>
                <button
                    onClick={() => dispatch(fetchDeliveries({ limit: 50, offset: 0 }))}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                >
                    <RefreshCw className="w-4 h-4" />
                    Refresh
                </button>
            </div>

            <div className="flex gap-2">
                <button
                    onClick={() => setFilter('')}
                    className={`px-4 py-2 rounded-lg font-medium ${
                        filter === ''
                            ? 'bg-blue-600 text-white'
                            : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                    }`}
                >
                    All
                </button>
                {['pending', 'delivered', 'failed', 'retrying'].map((status) => (
                    <button
                        key={status}
                        onClick={() => setFilter(status)}
                        className={`px-4 py-2 rounded-lg font-medium capitalize ${
                            filter === status
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-200 text-gray-800 hover:bg-gray-300'
                        }`}
                    >
                        {status}
                    </button>
                ))}
            </div>

            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800">
                    Error: {typeof error === 'string' ? error : JSON.stringify(error)}
                </div>
            )}

            {loading ? (
                <div className="text-center py-12">
                    <p className="text-gray-600">Loading deliveries...</p>
                </div>
            ) : filteredDeliveries.length === 0 ? (
                <div className="bg-white rounded-lg shadow p-12 text-center">
                    <p className="text-gray-600">No deliveries found. Create some events and webhooks to see deliveries here.</p>
                </div>
            ) : (
                <div className="bg-white rounded-lg shadow overflow-hidden">
                    <table className="w-full">
                        <thead className="bg-gray-50 border-b">
                            <tr>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Event Type</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Webhook</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Status</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Retries</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Last Attempt</th>
                                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-900">Action</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y">
                            {filteredDeliveries.map((delivery) => (
                                <tr key={delivery.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 text-sm text-gray-900">
                                        {delivery.event?.eventType || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {delivery.webhook?.name || 'N/A'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(delivery.status)}`}>
                                            {delivery.status}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{delivery.retryCount}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {delivery.lastAttemptAt
                                            ? new Date(delivery.lastAttemptAt).toLocaleString()
                                            : 'Never'}
                                    </td>
                                    <td className="px-6 py-4 text-sm">
                                        {delivery.status === 'failed' && (
                                            <button
                                                onClick={() => handleRetry(delivery.id)}
                                                className="flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-xs"
                                            >
                                                <RotateCcw className="w-3 h-3" />
                                                Retry
                                            </button>
                                        )}
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

export default DeliveriesPage;

