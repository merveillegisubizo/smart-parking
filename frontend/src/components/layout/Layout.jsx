import { Link, useLocation } from 'react-router-dom';

const Layout = ({ children, user, onLogout }) => {
  const location = useLocation();

  const navItems = [
    { path: '/', label: 'Dashboard' },
    { path: '/parking-slots', label: 'Parking Slots' },
    { path: '/car-entry', label: 'Car Entry' },
    { path: '/car-exit', label: 'Car Exit' },
    { path: '/payments', label: 'Payments' },
    { path: '/reports', label: 'Reports' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <header className="bg-gray-900 text-white shadow-lg">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold">SmartPark</h1>
              <p className="text-sm text-gray-400 ml-3">Parking Management</p>
            </div>

            <nav className="flex items-center space-x-1">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center px-4 py-2 rounded-md transition-colors ${location.pathname === item.path
                      ? 'bg-gray-800 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                    }`}
                >
                  <span className="hidden md:inline">{item.label}</span>
                </Link>
              ))}
            </nav>

            <div className="flex items-center space-x-4">
              <span className="text-gray-300 font-medium">
                Hello, {user?.username}
              </span>
              <button
                onClick={onLogout}
                className="flex items-center px-3 py-2 text-gray-300 hover:bg-gray-800 hover:text-white rounded-md transition-colors"
              >
                <span className="hidden md:inline">Logout</span>
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="flex-1 container mx-auto px-6 py-8">
        <div className="bg-white rounded-lg shadow-sm min-h-full">
          <div className="p-6">
            {children}
          </div>
        </div>
      </main>

      <footer className="bg-gray-900 text-white border-t border-gray-800">
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6">
              <div className="text-sm">
                <span className="text-gray-400">SMARTPARK MANAGEMENT SYSTEM</span>
              </div>
            </div>

            <div className="text-sm text-gray-400">
              © 2025 SmartPark. All rights reserved.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Layout;
