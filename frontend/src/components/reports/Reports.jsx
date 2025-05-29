import { useState, useEffect } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Calendar, Clock, Printer } from 'lucide-react';

// Utility functions
const formatDateTime = (dateString) => {
  const options = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  };
  return new Date(dateString).toLocaleString(undefined, options);
};

const formatDuration = (hours) => {
  return `${hours} hour${hours !== 1 ? 's' : ''}`;
};

const formatDate = (date) => {
  return new Date(date).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
};

// Date picker component
const DatePicker = ({ date, onDateChange, maxDate }) => (
  <div className="mb-4 md:mb-0">
    <label htmlFor="date" className="block text-sm font-medium text-gray-700 mb-1">
      Select Date
    </label>
    <div className="flex items-center">
      <Calendar size={20} className="text-gray-500 mr-2" />
      <input
        type="date"
        id="date"
        value={date}
        onChange={onDateChange}
        max={maxDate}
        className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-900"
      />
    </div>
  </div>
);

// Summary component
const ReportSummary = ({ report }) => (
  <div className="bg-gray-100 p-4 rounded-lg">
    <div className="flex items-center">
      <div>
        <p className="text-sm text-gray-600">Total Revenue</p>
        <p className="text-2xl font-bold text-gray-900">RWF{report.totalAmount.toFixed(2)}</p>
      </div>
    </div>
  </div>
);

// Print button component
const PrintButton = ({ onPrint, disabled }) => (
  <button
    onClick={onPrint}
    disabled={disabled}
    className="flex items-center px-4 py-2 bg-gray-900 text-white rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
  >
    <Printer size={20} className="mr-2" />
    Print Report
  </button>
);

// Transaction table component
const TransactionTable = ({ report, loading, selectedDate }) => (
  <div className="bg-white rounded-lg shadow-md overflow-hidden">
    <div className="p-6 border-b border-gray-200">
      <h2 className="text-xl font-semibold text-gray-900">
        Transactions for {formatDate(selectedDate)}
      </h2>
    </div>
    {loading ? (
      <div className="p-6 text-center">
        <p className="text-gray-500">Loading report data...</p>
      </div>
    ) : report && report.records.length > 0 ? (
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              {['Car Details', 'Parking Details', 'Payment', 'Received By'].map((header) => (
                <th
                  key={header}
                  className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                >
                  {header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {report.records.map((record) => (
              <tr key={record.paymentId}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">{record.plateNumber}</div>
                  <div className="text-sm text-gray-500">{record.driverName}</div>
                  <div className="text-sm text-gray-500">{record.phoneNumber}</div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">Slot {record.slotNumber}</div>
                  <div className="text-sm text-gray-500">
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>In: {formatDateTime(record.entryTime)}</span>
                    </div>
                    <div className="flex items-center">
                      <Clock size={14} className="mr-1" />
                      <span>Out: {formatDateTime(record.exitTime)}</span>
                    </div>
                  </div>
                  <div className="text-sm text-gray-500">
                    Duration: {formatDuration(record.duration)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm font-medium text-gray-900">
                    RWF {parseFloat(record.amountPaid).toFixed(2)}
                  </div>
                  <div className="text-sm text-gray-500">
                    {formatDateTime(record.paymentDate)}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {record.receivedBy}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ) : (
      <div className="p-6 text-center">
        <p className="text-gray-500">No transactions found for this date</p>
      </div>
    )}
  </div>
);

const Reports = () => {
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchReport = async () => {
      setLoading(true);
      try {
        const { data } = await axios.get(`/api/reports/daily?date=${date}`);
        setReport(data);
      } catch (error) {
        toast.error('Failed to fetch report');
        console.error('Error fetching report:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchReport();
  }, [date]);

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    const printContent = `
      <html>
        <head>
          <title>Daily Report - ${formatDate(date)}</title>
          <style>
            body {
              font-family: Arial, sans-serif;
              margin: 20px;
              color: #333;
            }
            .header {
              text-align: center;
              margin-bottom: 20px;
            }
            .summary {
              margin-bottom: 20px;
              padding: 10px;
              background: #f5f5f5;
              border-radius: 4px;
            }
            table {
              width: 100%;
              border-collapse: collapse;
              margin-top: 20px;
            }
            th, td {
              border: 1px solid #ddd;
              padding: 8px;
              text-align: left;
            }
            th {
              background: #f5f5f5;
              font-weight: bold;
            }
            @media print {
              .no-print {
                display: none;
              }
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Daily Report</h1>
            <h3>${formatDate(date)}</h3>
          </div>
          ${report ? `
            <div class="summary">
              <strong>Total Revenue: RWF${report.totalAmount.toFixed(2)}</strong>
            </div>
            <table>
              <thead>
                <tr>
                  <th>Car Details</th>
                  <th>Parking Details</th>
                  <th>Payment</th>
                  <th>Received By</th>
                </tr>
              </thead>
              <tbody>
                ${report.records.map(record => `
                  <tr>
                    <td>
                      ${record.plateNumber}<br>
                      ${record.driverName}<br>
                      ${record.phoneNumber}
                    </td>
                    <td>
                      Slot ${record.slotNumber}<br>
                      In: ${formatDateTime(record.entryTime)}<br>
                      Out: ${formatDateTime(record.exitTime)}<br>
                      Duration: ${formatDuration(record.duration)}
                    </td>
                    <td>
                      RWF ${parseFloat(record.amountPaid).toFixed(2)}<br>
                      ${formatDateTime(record.paymentDate)}
                    </td>
                    <td>${record.receivedBy}</td>
                  </tr>
                `).join('')}
              </tbody>
            </table>
            <div>
            <h4>Prepared by:</h4>
            <p>Name:_______________</p>
            <p>Signature:____________</p>
            </div>
          ` : '<p>No transactions found for this date</p>'}
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Daily Reports</h1>
      <div className="bg-white rounded-lg shadow-md p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <DatePicker
            date={date}
            onDateChange={(e) => setDate(e.target.value)}
            maxDate={new Date().toISOString().split('T')[0]}
          />
          <div className="flex items-center gap-4">
            {report && <ReportSummary report={report} />}
            <PrintButton
              onPrint={handlePrint}
              disabled={loading || !report || !report.records.length}
            />
          </div>
        </div>
      </div>
      <TransactionTable report={report} loading={loading} selectedDate={date} />
    </div>
  );
};

export default Reports;