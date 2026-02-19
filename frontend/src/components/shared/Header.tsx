import { useAuth } from '@/contexts/auth.context';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { LogOut } from 'lucide-react';
import ConfirmationModal from './Modal';
import NotificationDropdown from './NotificationDropdown';

interface HeaderProps {
  onMenuClick: () => void;
  userRole: string;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const navigate = useNavigate();
  const { logout } = useAuth();
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogoutClick = () => {
    setIsLogoutModalOpen(true);
  };

  const handleLogoutConfirm = async () => {
    setIsLoggingOut(true);
    try {
      const response = await logout();
      const message =
        typeof response === 'object' &&
        response !== null &&
        'message' in response &&
        typeof (response as { message?: unknown }).message === 'string'
          ? (response as { message: string }).message
          : 'Logged out successfully';
      toast.success(message);
      setIsLogoutModalOpen(false);
      navigate("/auth/form", { replace: true });
    } catch (error: unknown) {
      console.error("Error during logout:", error);
      const errorMessage =
        typeof error === 'object' &&
        error !== null &&
        'response' in error &&
        typeof (error as { response?: { data?: { message?: unknown } } }).response?.data?.message === 'string'
          ? ((error as { response?: { data?: { message?: string } } }).response?.data?.message as string)
          : error instanceof Error
            ? error.message
            : 'Failed to logout';
      toast.error(errorMessage);
      setIsLoggingOut(false);
    }
  };

  const handleLogoutCancel = () => {
    setIsLogoutModalOpen(false);
  };

  return (
    <>
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 h-16 flex items-center justify-between px-6 sticky top-0 z-30 transition-colors duration-300">
        <div className="flex items-center">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        <div className="flex items-center space-x-2">
          <NotificationDropdown />
          <button 
            onClick={handleLogoutClick}
            className="flex items-center space-x-2 px-4 py-2 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all duration-300 border border-red-200 dark:border-red-800"
            title="Logout"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            <span className="hidden sm:inline-block font-medium text-sm">Logout</span>
          </button>
        </div>
      </header>

      <ConfirmationModal
        isOpen={isLogoutModalOpen}
        onClose={handleLogoutCancel}
        title="Confirm Logout"
        description="Are you sure you want to logout? You will need to sign in again to access your account."
        icon={<LogOut className="w-6 h-6" />}
        variant="warning"
        size="md"
        confirmButton={{
          label: "Logout",
          variant: "danger",
          onClick: handleLogoutConfirm,
          loading: isLoggingOut
        }}
        cancelButton={{ 
          label: "Cancel",
          variant: "secondary",
          onClick: handleLogoutCancel,
          disabled: isLoggingOut
        }}
        closeOnOutsideClick={!isLoggingOut}
        preventCloseWhileLoading={true}
      />
    </>
  );
};

export default Header;