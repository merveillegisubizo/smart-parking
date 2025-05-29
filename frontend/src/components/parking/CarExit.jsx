import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Clock } from 'lucide-react';

const CarExit = () => {
  const [activeCars, setActiveCars] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCar, setSelectedCar] = useState(null);
  const [processing, setProcessing] = useState(false);
  const [receipt, setReceipt] = useState(null);
  const hourlyRate = 500; // Fixed rate of 500 RWF per hour

  useEffect(() => {
    fetchActiveCars();
  }, []);

  const fetchActiveCars = async () => {
    try {
      const { data } = await axios.get('/api/parking-records/active');
      setActiveCars(data);
    } catch (error) {
      toast.error('Failed to fetch active cars');
      console.error('Error fetching active cars:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCar = (car) => {
    setSelectedCar(car);
    setReceipt(null);
  };

  const handleProcessExit = async () => {
    if (!selectedCar) {
      toast.error('Please select a car');
      return;
    }

    setProcessing(true);

    try {
      const { data } = await axios.post('/api/parking-records/exit', {
        parkingRecordId: selectedCar.id
      });

      setReceipt({
        ...data,
        car: selectedCar
      });

      toast.success('Car exit processed successfully');

      // Refresh active cars
      fetchActiveCars();
      setSelectedCar(null);
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to process car exit');
      console.error('Error processing car exit:', error);
    } finally {
      setProcessing(false);
    }
  };

  const formatDateTime = (dateString) => {
    const options = {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date(dateString).toLocaleString(undefined, options);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading active cars...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Car Exit</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Active Cars</h2>

          {activeCars.length === 0 ? (
            <p className="text-gray-500">No active cars in the parking lot</p>
          ) : (
            <div className="space-y-4">
              {activeCars.map((car) => (
                <div
                  key={car.id}
                  className={`p-4 border rounded-lg cursor-pointer transition-colors ${
                    selectedCar?.id === car.id
                      ? 'border-gray-900 bg-gray-50'
                      : 'border-gray-200 hover:border-gray-400'
                  }`}
                  onClick={() => handleSelectCar(car)}
                >
                  <div className="flex justify-between">
                    <div>
                      <h3 className="font-semibold text-gray-900">{car.plateNumber}</h3>
                      <p className="text-sm text-gray-600">{car.driverName}</p>
                      <p className="text-sm text-gray-600">{car.phoneNumber}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-600">Slot {car.slotNumber}</p>
                      <div className="flex items-center text-sm text-gray-600 mt-1">
                        <Clock size={14} className="mr-1" />
                        <span>{formatDateTime(car.entryTime)}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-md p-6">
          {receipt ? (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Payment Receipt</h2>

              <div className="border-t border-b border-gray-200 py-4 my-4">
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Plate Number:</span>
                  <span className="font-semibold">{receipt.car.plateNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Driver:</span>
                  <span>{receipt.car.driverName}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Phone:</span>
                  <span>{receipt.car.phoneNumber}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Parking Duration:</span>
                  <span>{receipt.durationHours} hour(s)</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-600">Hourly Rate:</span>
                  <span>500 RWF</span>
                </div>
              </div>

              <div className="flex justify-between items-center text-xl font-bold">
                <span>Total Amount:</span>
                <span>{receipt.amount.toLocaleString()} RWF</span>
              </div>

              <button
                onClick={() => setReceipt(null)}
                className="mt-6 w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
              >
                Process Another Exit
              </button>
            </div>
          ) : (
            <div>
              <h2 className="text-xl font-semibold text-gray-900 mb-4">Process Exit</h2>

              {selectedCar ? (
                <div>
                  <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <h3 className="font-semibold text-gray-900 mb-2">{selectedCar.plateNumber}</h3>
                    <p className="text-sm text-gray-600">Driver: {selectedCar.driverName}</p>
                    <p className="text-sm text-gray-600">Phone: {selectedCar.phoneNumber}</p>
                    <p className="text-sm text-gray-600">Slot: {selectedCar.slotNumber}</p>
                    <p className="text-sm text-gray-600">
                      Entry Time: {formatDateTime(selectedCar.entryTime)}
                    </p>
                  </div>

                  <div className="mb-6">
                    <div className="block text-sm font-medium text-gray-700 mb-1">
                      Hourly Rate
                    </div>
                    <div className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50">
                      500 RWF per hour
                    </div>
                  </div>

                  <button
                    onClick={handleProcessExit}
                    disabled={processing}
                    className="w-full bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors disabled:opacity-50"
                  >
                    {processing ? 'Processing...' : 'Process Exit & Payment'}
                  </button>
                </div>
              ) : (
                <p className="text-gray-500">Select a car from the list to process exit</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default CarExit;
