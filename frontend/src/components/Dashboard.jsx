import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchEventStats } from '../store/slices/eventsSlice';
import { fetchDeliveryStats } from '../store/slices/deliveriesSlice';
import Navigation from './Navigation';
import EventsPage from './pages/EventsPage';
import WebhooksPage from './pages/WebhooksPage';
import DeliveriesPage from './pages/DeliveriesPage';
import DashboardPage from './pages/DashboardPage';

const Dashboard = () => {
    const [currentPage, setCurrentPage] = useState('dashboard');
    const dispatch = useDispatch();
    const eventStats = useSelector((state) => state.events.stats);
    const deliveryStats = useSelector((state) => state.deliveries.stats);
    const eventLoading = useSelector((state) => state.events.loading);
    const deliveryLoading = useSelector((state) => state.deliveries.loading);
    const eventError = useSelector((state) => state.events.error);
    const deliveryError = useSelector((state) => state.deliveries.error);

    useEffect(() => {
        dispatch(fetchEventStats());
        dispatch(fetchDeliveryStats());

        // Refresh stats every 30 seconds
        const interval = setInterval(() => {
            dispatch(fetchEventStats());
            dispatch(fetchDeliveryStats());
        }, 30000);

        return () => clearInterval(interval);
    }, [dispatch]);

    const renderPage = () => {
        switch (currentPage) {
            case 'dashboard':
                return <DashboardPage 
                    stats={{ eventStats, deliveryStats }} 
                    loading={{ eventLoading, deliveryLoading }}
                    errors={{ eventError, deliveryError }}
                />;
            case 'events':
                return <EventsPage />;
            case 'webhooks':
                return <WebhooksPage />;
            case 'deliveries':
                return <DeliveriesPage />;
            default:
                return <DashboardPage 
                    stats={{ eventStats, deliveryStats }} 
                    loading={{ eventLoading, deliveryLoading }}
                    errors={{ eventError, deliveryError }}
                />;
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            <Navigation currentPage={currentPage} onPageChange={setCurrentPage} />
            <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
                {renderPage()}
            </main>
        </div>
    );
};

export default Dashboard;

