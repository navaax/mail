import React, { useEffect, useState } from 'react';
import { LogOut, User } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Notifications } from './Notifications';

export function Header() {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    getCurrentUser();
  }, []);

  async function getCurrentUser() {
    const { data: { user } } = await supabase.auth.getUser();
    setUserEmail(user?.email || null);
  }

  const handleLogout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      window.location.reload();
    } catch (error) {
      toast.error('Error al cerrar sesión');
    }
  };

  return (
    <header className="bg-white shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <User className="h-6 w-6 text-blue-600 mr-2" />
            <span className="text-gray-700 font-medium">{userEmail}</span>
          </div>
          <div className="flex items-center space-x-4">
            <Notifications />
            <button
              onClick={handleLogout}
              className="flex items-center text-gray-600 hover:text-gray-900"
            >
              <LogOut className="h-5 w-5 mr-1" />
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}