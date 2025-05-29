import { useState, useEffect } from 'react';
import axios from 'axios';
import { Car, Grid, Clock, DollarSign } from 'lucide-react';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalSlots: 0,
    availableSlots: 0,
    occupiedSlots: 0,
    activeCars: 0
  });
  const [loading, setLoading] = useState(true);
  const [todayRevenue, setTodayRevenue] = useState(0);

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch parking slots
        const slotsResponse = await axios.get('/api/parking-slots');
        const slots = slotsResponse.data;
        
        // Fetch active parking records
        const activeResponse = await axios.get('/api/parking-records/active');
        const activeCars = activeResponse.data;
        
        // Fetch today's revenue
        const today = new Date().toISOString().split('T')[0];
        const revenueResponse = await axios.get(`/api/reports/daily?date=${today}`);
        
        setStats({
          totalSlots: slots.length,
          availableSlots: slots.filter(slot => slot.slotStatus === 'available').length,
          occupiedSlots: slots.filter(slot => slot.slotStatus === 'occupied').length,
          activeCars: activeCars.length
        });
        
        setTodayRevenue(revenueResponse.data.totalAmount || 0);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  const StatCard = ({ title, value}) => (
    <div className="bg-blue-950/20 rounded-lg shadow-md p-6">
      <div className="flex items-center">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-semibold text-gray-900">{value}</p>
        </div>
      </div>
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading dashboard data...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <StatCard
          title="Total Parking Slots"
          value={stats.totalSlots}
        />
        <StatCard
          title="Available Slots"
          value={stats.availableSlots}
        />
        <StatCard
          title="Occupied Slots"
          value={stats.occupiedSlots}
        />
        <StatCard
          title="Active Cars"
          value={stats.activeCars}
        />
      </div>
      
      <div className="bg-blue-950/20 rounded-lg shadow-md p-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Today's Revenue</h2>
        <div className="flex items-center">
          <div>
            <p className="text-3xl font-bold text-gray-900">RWF{todayRevenue.toFixed(2)}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
