import { BarChart3, Webhook, Send, FileText } from 'lucide-react';

const Navigation = ({ currentPage, onPageChange }) => {
    const navItems = [
        { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
        { id: 'events', label: 'Events', icon: FileText },
        { id: 'webhooks', label: 'Webhooks', icon: Webhook },
        { id: 'deliveries', label: 'Deliveries', icon: Send },
    ];

    return (
        <nav className="bg-white shadow-sm border-b border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    <div className="flex items-center gap-2">
                        <Webhook className="w-8 h-8 text-blue-600" />
                        <h1 className="text-2xl font-bold text-gray-900">Webhook Relay</h1>
                    </div>
                    <div className="flex gap-1">
                        {navItems.map((item) => {
                            const Icon = item.icon;
                            const isActive = currentPage === item.id;
                            return (
                                <button
                                    key={item.id}
                                    onClick={() => onPageChange(item.id)}
                                    className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-colors ${
                                        isActive
                                            ? 'bg-blue-100 text-blue-700'
                                            : 'text-gray-600 hover:bg-gray-100'
                                    }`}
                                >
                                    <Icon className="w-5 h-5" />
                                    {item.label}
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </nav>
    );
};

export default Navigation;

