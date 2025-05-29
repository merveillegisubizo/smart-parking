import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';

const CarEntry = () => {
  const [formData, setFormData] = useState({
    plateNumber: '',
    driverName: '',
    phoneNumber: '',
    slotNumber: ''
  });
  const [availableSlots, setAvailableSlots] = useState([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchAvailableSlots();
  }, []);

  const fetchAvailableSlots = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get('/api/parking-slots');
      const available = data.filter(slot => slot.slotStatus === 'available');
      setAvailableSlots(available);
    } catch (error) {
      toast.error('Failed to fetch available slots');
      console.error('Error fetching available slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.plateNumber || !formData.driverName || !formData.phoneNumber || !formData.slotNumber) {
      toast.error('Please fill in all fields');
      return;
    }
    
    setSubmitting(true);
    
    try {
      // First, register/update the car
      await axios.post('/api/cars', {
        plateNumber: formData.plateNumber,
        driverName: formData.driverName,
        phoneNumber: formData.phoneNumber
      });
      
      // Then, create the parking record
      await axios.post('/api/parking-records/entry', {
        plateNumber: formData.plateNumber,
        slotNumber: formData.slotNumber
      });
      
      toast.success('Car entry recorded successfully');
      
      // Reset form
      setFormData({
        plateNumber: '',
        driverName: '',
        phoneNumber: '',
        slotNumber: ''
      });
      
      // Refresh available slots
      fetchAvailableSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to record car entry');
      console.error('Error recording car entry:', error);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Car Entry</h1>
      
      <div className="bg-white rounded-lg shadow-md p-6">
        <form onSubmit={handleSubmit}>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="plateNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Plate Number
              </label>
              <input
                type="text"
                id="plateNumber"
                name="plateNumber"
                value={formData.plateNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g., RAB 123A"
              />
            </div>
            
            <div>
              <label htmlFor="driverName" className="block text-sm font-medium text-gray-700 mb-1">
                Driver Name
              </label>
              <input
                type="text"
                id="driverName"
                name="driverName"
                value={formData.driverName}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Enter driver's name"
              />
            </div>
            
            <div>
              <label htmlFor="phoneNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="text"
                id="phoneNumber"
                name="phoneNumber"
                value={formData.phoneNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="e.g., 078XXXXXXX"
              />
            </div>
            
            <div>
              <label htmlFor="slotNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Parking Slot
              </label>
              <select
                id="slotNumber"
                name="slotNumber"
                value={formData.slotNumber}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                disabled={loading || availableSlots.length === 0}
              >
                <option value="">Select a parking slot</option>
                {availableSlots.map((slot) => (
                  <option key={slot.slotNumber} value={slot.slotNumber}>
                    Slot {slot.slotNumber}
                  </option>
                ))}
              </select>
              {availableSlots.length === 0 && !loading && (
                <p className="mt-1 text-sm text-red-600">No available parking slots</p>
              )}
            </div>
          </div>
          
          <div className="mt-6">
            <button
              type="submit"
              disabled={submitting || availableSlots.length === 0}
              className="bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors disabled:opacity-50"
            >
              {submitting ? 'Recording Entry...' : 'Record Car Entry'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CarEntry;
