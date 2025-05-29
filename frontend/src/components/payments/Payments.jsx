import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Clock, Download } from 'lucide-react';

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setHours(0, 0, 0, 0)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [showBill, setShowBill] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, [dateRange]);

  const fetchPayments = async () => {
    setLoading(true);
    try {
      const { data } = await axios.get(`/api/payments?startDate=${dateRange.startDate}&endDate=${dateRange.endDate}`);
      setPayments(data);
    } catch (error) {
      toast.error('Failed to fetch payments');
      console.error('Error fetching payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDateChange = (e) => {
    setDateRange({
      ...dateRange,
      [e.target.name]: e.target.value
    });
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

  const formatDuration = (hours) => {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  };

  const formatCurrency = (amount) => {
    return `${amount.toLocaleString()} RWF`;
  };

  const handleViewBill = (payment) => {
    setSelectedPayment(payment);
    setShowBill(true);
  };

  const handlePrintBill = () => {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>SmartPark - Payment Receipt</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .receipt {
              max-width: 800px;
              margin: 0 auto;
              border: 1px solid #ccc;
              padding: 20px;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            .info-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 10px;
              border-bottom: 1px solid #eee;
              padding-bottom: 10px;
            }
            .label {
              font-weight: bold;
              color: #555;
            }
            .value {
              text-align: right;
            }
            .total {
              font-size: 1.2em;
              font-weight: bold;
              margin-top: 20px;
              text-align: right;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 0.9em;
              color: #777;
            }
            @media print {
              body {
                padding: 0;
              }
              .receipt {
                border: none;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <h1>SmartPark</h1>
              <p>Parking Payment Receipt</p>
              <p>Receipt #: ${selectedPayment.paymentId}</p>
            </div>
            
            <div class="info-row">
              <span class="label">Plate Number:</span>
              <span class="value">${selectedPayment.plateNumber}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Driver Name:</span>
              <span class="value">${selectedPayment.driverName}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Phone Number:</span>
              <span class="value">${selectedPayment.phoneNumber}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Entry Time:</span>
              <span class="value">${formatDateTime(selectedPayment.entryTime)}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Exit Time:</span>
              <span class="value">${formatDateTime(selectedPayment.exitTime)}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Duration:</span>
              <span class="value">${formatDuration(selectedPayment.duration)}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Rate:</span>
              <span class="value">500 RWF per hour</span>
            </div>
            
            <div class="total">
              <span class="label">Total Amount:</span>
              <span class="value">${formatCurrency(parseFloat(selectedPayment.amountPaid))}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Payment Date:</span>
              <span class="value">${formatDateTime(selectedPayment.paymentDate)}</span>
            </div>
            
            <div class="info-row">
              <span class="label">Received By:</span>
              <span class="value">${selectedPayment.receivedBy}</span>
            </div>
            
            <div class="footer">
              <p>Thank you for using SmartPark!</p>
              <p>Rubavu District, West Province, Rwanda</p>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">Print Receipt</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  };

  const handleGenerateReport = () => {
    const printWindow = window.open('', '_blank');
    
    printWindow.document.write(`
      <html>
        <head>
          <title>SmartPark - Daily Report</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 20px;
            }
            .report {
              max-width: 1000px;
              margin: 0 auto;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
              border-bottom: 2px solid #333;
              padding-bottom: 10px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background-color: #f2f2f2;
            }
            tr:nth-child(even) {
              background-color: #f9f9f9;
            }
            .total {
              font-size: 1.2em;
              font-weight: bold;
              margin-top: 20px;
              text-align: right;
            }
            .footer {
              margin-top: 30px;
              text-align: center;
              font-size: 0.9em;
              color: #777;
            }
            @media print {
              body {
                padding: 0;
              }
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="report">
            <div class="header">
              <h1>SmartPark</h1>
              <p>Daily Parking Payment Report</p>
              <p>Period: ${new Date(dateRange.startDate).toLocaleDateString()} - ${new Date(dateRange.endDate).toLocaleDateString()}</p>
            </div>
            
            <table>
              <thead>
                <tr>
                  <th>Plate Number</th>
                  <th>Driver Name</th>
                  <th>Entry Time</th>
                  <th>Exit Time</th>
                  <th>Duration</th>
                  <th>Amount Paid</th>
                </tr>
              </thead>
              <tbody>
                ${payments.map(payment => `
                  <tr>
                    <td>${payment.plateNumber}</td>
                    <td>${payment.driverName}</td>
                    <td>${formatDateTime(payment.entryTime)}</td>
                    <td>${formatDateTime(payment.exitTime)}</td>
                    <td>${formatDuration(payment.duration)}</td>
                    <td>${formatCurrency(parseFloat(payment.amountPaid))}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            
            <div class="total">
              <span>Total Revenue: ${formatCurrency(payments.reduce((sum, payment) => sum + parseFloat(payment.amountPaid), 0))}</span>
            </div>
            
            <div class="footer">
              <p>SmartPark - Rubavu District, West Province, Rwanda</p>
              <p>Generated on: ${new Date().toLocaleString()}</p>
            </div>
          </div>
          
          <div class="no-print" style="text-align: center; margin-top: 20px;">
            <button onclick="window.print()">Print Report</button>
          </div>
        </body>
      </html>
    `);
    
    printWindow.document.close();
    printWindow.focus();
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
        <button
          onClick={handleGenerateReport}
          className="flex items-center bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
        >
          <Download size={18} className="mr-1" />
          Generate Report
        </button>
      </div>
      
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">Filter Payments</h2>
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1">
            <label htmlFor="startDate" className="block text-sm font-medium text-gray-700 mb-1">
              Start Date
            </label>
            <div className="flex items-center">
              <Calendar size={20} className="text-gray-500 mr-2" />
              <input
                type="date"
                id="startDate"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 w-full"
              />
            </div>
          </div>
          
          <div className="flex-1">
            <label htmlFor="endDate" className="block text-sm font-medium text-gray-700 mb-1">
              End Date
            </label>
            <div className="flex items-center">
              <Calendar size={20} className="text-gray-500 mr-2" />
              <input
                type="date"
                id="endDate"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
                max={new Date().toISOString().split('T')[0]}
                className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900 w-full"
              />
            </div>
          </div>
        </div>
      </div>
      
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Payment Records</h2>
        </div>
        
        {loading ? (
          <div className="p-6 text-center">
            <p className="text-gray-500">Loading payment data...</p>
          </div>
        ) : payments.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Receipt #
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Car Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Parking Details
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Payment
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((payment) => (
                  <tr key={payment.paymentId}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">#{payment.paymentId}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{payment.plateNumber}</div>
                      <div className="text-sm text-gray-500">{payment.driverName}</div>
                      <div className="text-sm text-gray-500">{payment.phoneNumber}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">Slot {payment.slotNumber}</div>
                      <div className="text-sm text-gray-500">
                        <div className="flex items-center">
                          <Clock size={14} className="mr-1" />
                          <span>Duration: {formatDuration(payment.duration)}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">
                        {formatCurrency(parseFloat(payment.amountPaid))}
                      </div>
                      <div className="text-sm text-gray-500">
                        {formatDateTime(payment.paymentDate)}
                      </div>
                      <div className="text-sm text-gray-500">
                        By: {payment.receivedBy}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <button
                        onClick={() => handleViewBill(payment)}
                        className="text-gray-900 hover:text-gray-700 font-medium"
                      >
                        View Bill
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-6 text-center">
            <p className="text-gray-500">No payment records found for the selected date range</p>
          </div>
        )}
      </div>
      
      {/* Bill Modal */}
      {showBill && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h2 className="text-xl font-semibold text-gray-900">Payment Receipt</h2>
                <button
                  onClick={() => setShowBill(false)}
                  className="text-gray-500 hover:text-gray-700"
                >
                  &times;
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="mb-6 text-center">
                <h3 className="text-lg font-bold text-gray-900">SmartPark</h3>
                <p className="text-sm text-gray-600">Rubavu District, West Province, Rwanda</p>
                <p className="text-sm text-gray-600">Receipt #: {selectedPayment.paymentId}</p>
              </div>
              
              <div className="space-y-4">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Plate Number:</span>
                  <span>{selectedPayment.plateNumber}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Driver Name:</span>
                  <span>{selectedPayment.driverName}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Phone Number:</span>
                  <span>{selectedPayment.phoneNumber}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Entry Time:</span>
                  <span>{formatDateTime(selectedPayment.entryTime)}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Exit Time:</span>
                  <span>{formatDateTime(selectedPayment.exitTime)}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Duration:</span>
                  <span>{formatDuration(selectedPayment.duration)}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Rate:</span>
                  <span>500 RWF per hour</span>
                </div>
                
                <div className="flex justify-between border-b pb-2 text-lg font-bold">
                  <span>Total Amount:</span>
                  <span>{formatCurrency(parseFloat(selectedPayment.amountPaid))}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Payment Date:</span>
                  <span>{formatDateTime(selectedPayment.paymentDate)}</span>
                </div>
                
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium text-gray-600">Received By:</span>
                  <span>{selectedPayment.receivedBy}</span>
                </div>
              </div>
            </div>
            
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={handlePrintBill}
                className="bg-gray-900 text-white py-2 px-4 rounded-md hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-gray-900 focus:ring-offset-2 transition-colors"
              >
                Print Receipt
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payments;
