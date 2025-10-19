import { Activity, AlertCircle, CheckCircle, Clock } from 'lucide-react';


const StatCard = ({ title, value, icon: Icon, color }) => (
    <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between">
            <div>
                <p className="text-gray-600 text-sm font-medium">{title}</p>
                <p className="text-3xl font-bold text-gray-900 mt-2">{value}</p>
            </div>
            <div className={`p-3 rounded-lg ${color}`}>
                <Icon className="w-6 h-6 text-white" />
            </div>
        </div>
    </div>
);

const DashboardPage = ({ stats, loading = {}, errors = {} }) => {



    const { eventStats = {}, deliveryStats = {} } = stats || {};
    const { eventLoading = false, deliveryLoading = false } = loading;
    const { eventError = null, deliveryError = null } = errors;
    
    // Provide default values to prevent undefined errors
    const safeEventStats = {
        total: 0,
        pending: 0,
        completed: 0,
        failed: 0,
        ...eventStats
    };
    
    const safeDeliveryStats = {
        total: 0,
        pending: 0,
        delivered: 0,
        failed: 0,
        retrying: 0,
        ...deliveryStats
    };

    return (
        <div className="space-y-6">
            <div className="flex justify-between items-center">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">Dashboard</h2>
                    <p className="text-gray-600 mt-1">System overview and statistics</p>
                </div>
                <button
                    onClick={() => {
                        window.location.reload();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                    Refresh Stats
                </button>
            </div>

            {/* Event Statistics */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Event Statistics</h3>
                {eventError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-800">
                        Error loading event stats: {typeof eventError === 'string' ? eventError : JSON.stringify(eventError)}
                    </div>
                )}
                {eventLoading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-blue-800">
                        Loading event statistics...
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Events"
                        value={safeEventStats.total}
                        icon={Activity}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Pending"
                        value={safeEventStats.pending}
                        icon={Clock}
                        color="bg-yellow-500"
                    />
                    <StatCard
                        title="Completed"
                        value={safeEventStats.completed}
                        icon={CheckCircle}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Failed"
                        value={safeEventStats.failed}
                        icon={AlertCircle}
                        color="bg-red-500"
                    />
                </div>
            </div>

            {/* Delivery Statistics */}
            <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Delivery Statistics</h3>
                {deliveryError && (
                    <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4 text-red-800">
                        Error loading delivery stats: {typeof deliveryError === 'string' ? deliveryError : JSON.stringify(deliveryError)}
                    </div>
                )}
                {deliveryLoading && (
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4 text-blue-800">
                        Loading delivery statistics...
                    </div>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <StatCard
                        title="Total Deliveries"
                        value={safeDeliveryStats.total}
                        icon={Activity}
                        color="bg-blue-500"
                    />
                    <StatCard
                        title="Pending"
                        value={safeDeliveryStats.pending}
                        icon={Clock}
                        color="bg-yellow-500"
                    />
                    <StatCard
                        title="Delivered"
                        value={safeDeliveryStats.delivered}
                        icon={CheckCircle}
                        color="bg-green-500"
                    />
                    <StatCard
                        title="Failed"
                        value={safeDeliveryStats.failed}
                        icon={AlertCircle}
                        color="bg-red-500"
                    />
                </div>
            </div>

            {/* System Health */}
            <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-3">
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">API Status</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Operational
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Database Status</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Connected
                        </span>
                    </div>
                    <div className="flex items-center justify-between">
                        <span className="text-gray-600">Redis Cache</span>
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-green-100 text-green-800">
                            ✓ Connected
                        </span>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default DashboardPage;

