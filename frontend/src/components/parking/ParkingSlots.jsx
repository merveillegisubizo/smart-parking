import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Car, Plus, Trash } from 'lucide-react';

const ParkingSlots = () => {
  const [slots, setSlots] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSlotNumber, setNewSlotNumber] = useState('');
  const [addingSlot, setAddingSlot] = useState(false);
  const [deletingSlot, setDeletingSlot] = useState(false);
  const [slotToDelete, setSlotToDelete] = useState(null);

  useEffect(() => {
    fetchParkingSlots();
  }, []);

  const fetchParkingSlots = async () => {
    try {
      const { data } = await axios.get('/api/parking-slots');
      setSlots(data);
    } catch (error) {
      toast.error('Failed to fetch parking slots');
      console.error('Error fetching parking slots:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSlot = async (e) => {
    e.preventDefault();

    if (!newSlotNumber || isNaN(newSlotNumber) || parseInt(newSlotNumber) <= 0) {
      toast.error('Please enter a valid slot number');
      return;
    }

    // Check if slot number already exists
    if (slots.some(slot => slot.slotNumber === parseInt(newSlotNumber))) {
      toast.error('Slot number already exists');
      return;
    }

    setAddingSlot(true);

    try {
      await axios.post('/api/parking-slots', {
        slotNumber: parseInt(newSlotNumber),
        slotStatus: 'available'
      });

      toast.success('Parking slot added successfully');
      setNewSlotNumber('');
      setShowAddForm(false);
      fetchParkingSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to add parking slot');
      console.error('Error adding parking slot:', error);
    } finally {
      setAddingSlot(false);
    }
  };

  const handleDeleteSlot = async (slotNumber) => {
    // Don't allow deleting occupied slots
    const slot = slots.find(s => s.slotNumber === slotNumber);
    if (slot.slotStatus === 'occupied') {
      toast.error('Cannot delete an occupied parking slot');
      return;
    }

    setDeletingSlot(true);
    setSlotToDelete(slotNumber);

    try {
      await axios.delete(`/api/parking-slots/${slotNumber}`);
      toast.success('Parking slot deleted successfully');
      fetchParkingSlots();
    } catch (error) {
      toast.error(error.response?.data?.message || 'Failed to delete parking slot');
      console.error('Error deleting parking slot:', error);
    } finally {
      setDeletingSlot(false);
      setSlotToDelete(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-gray-500">Loading parking slots...</p>
      </div>
    );
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Parking Slots</h1>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="flex items-center bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
        >
          <Plus size={18} className="mr-1" />
          Add Slot
        </button>
      </div>

      {showAddForm && (
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Add New Parking Slot</h2>
          <form onSubmit={handleAddSlot} className="flex items-end gap-4">
            <div className="flex-1">
              <label htmlFor="newSlotNumber" className="block text-sm font-medium text-gray-700 mb-1">
                Slot Number
              </label>
              <input
                type="number"
                id="newSlotNumber"
                value={newSlotNumber}
                onChange={(e) => setNewSlotNumber(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
                placeholder="Enter slot number"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={addingSlot}
                className="bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors disabled:opacity-50"
              >
                {addingSlot ? 'Adding...' : 'Add Slot'}
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="bg-gray-200 text-gray-800 py-2 px-4 rounded-md hover:bg-gray-300 focus:outline-none focus:ring-2 focus:ring-gray-300 focus:ring-offset-2 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-md p-6">
        {slots.length === 0 ? (
          <p className="text-center text-gray-500 py-8">No parking slots available. Add a new slot to get started.</p>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {slots.map((slot) => (
              <div
                key={slot.slotNumber}
                className={`p-4 rounded-lg border-2 ${
                  slot.slotStatus === 'available'
                    ? 'border-green-500 bg-green-50'
                    : 'border-red-500 bg-red-50'
                }`}
              >
                <div className="flex flex-col items-center">
                  <div
                    className={`w-12 h-12 rounded-full flex items-center justify-center mb-2 ${
                      slot.slotStatus === 'available'
                        ? 'bg-green-500 text-white'
                        : 'bg-red-500 text-white'
                    }`}
                  >
                    {slot.slotStatus === 'available' ? (
                      <span className="text-lg font-bold">{slot.slotNumber}</span>
                    ) : (
                      <Car size={20} />
                    )}
                  </div>
                  <p className="font-semibold text-gray-900">Slot {slot.slotNumber}</p>
                  <p
                    className={`text-sm ${
                      slot.slotStatus === 'available' ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {slot.slotStatus === 'available' ? 'Available' : 'Occupied'}
                  </p>

                  {slot.slotStatus === 'available' && (
                    <button
                      onClick={() => handleDeleteSlot(slot.slotNumber)}
                      disabled={deletingSlot && slotToDelete === slot.slotNumber}
                      className="mt-2 text-red-600 hover:text-red-800 focus:outline-none"
                      title="Delete slot"
                    >
                      <Trash size={16} />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default ParkingSlots;
