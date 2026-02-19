import Header from '@/components/shared/Header';
import Sidebar from '@/components/shared/Sidebar';
import { adminSidebarConfig } from '@/components/admin/SidebarConfig';
import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useTherapistSidebarConfig } from '@/components/therapist/SidebarConfig';

const DashboardLayout: React.FC = () => {
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const therapistConfig = useTherapistSidebarConfig();

  const getRoleFromPath = (path: string) => {
    if (path.startsWith('/admin')) return 'admin';
    if (path.startsWith('/therapist')) return 'therapist';
    return 'admin';
  };

  const role = getRoleFromPath(location.pathname);
  const currentConfig = role === "therapist" ? therapistConfig : adminSidebarConfig;

  const sidebarMargin = sidebarCollapsed ? 'lg:ml-16' : 'lg:ml-64';

  return (
    <div className="flex h-screen w-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-300">
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        isCollapsed={sidebarCollapsed}
        onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        config={currentConfig}
        currentPath={location.pathname}
      />
      
      <div className={`flex-1 flex flex-col overflow-hidden transition-all duration-300 ${sidebarMargin}`}>
        <Header 
          onMenuClick={() => setSidebarOpen(true)} 
          userRole={role} 
        />
        
        <main className="flex-1 overflow-y-auto">
          <div className="p-6">
            <Outlet/>
          </div>
        </main>
      </div>

      {sidebarOpen && (
        <div 
          className="fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-40 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
};

export default DashboardLayout;