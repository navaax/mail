import React, { useEffect, useState } from 'react';
import { Bell, Hash, AtSign } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';

interface Notification {
  id: string;
  type: 'mention' | 'thread';
  emailSubject: string;
  created_at: string;
}

export function Notifications() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showNotifications, setShowNotifications] = useState(false);

  useEffect(() => {
    fetchNotifications();
  }, []);

  async function fetchNotifications() {
    try {
      const { data: mentions, error: mentionsError } = await supabase
        .from('mentions')
        .select(`
          id,
          created_at,
          emails (
            subject
          )
        `)
        .order('created_at', { ascending: false });

      const { data: threads, error: threadsError } = await supabase
        .from('threads')
        .select(`
          id,
          created_at,
          topic,
          emails (
            subject
          )
        `)
        .order('created_at', { ascending: false });

      if (mentionsError || threadsError) throw mentionsError || threadsError;

      const formattedNotifications = [
        ...(mentions || []).map(m => ({
          id: m.id,
          type: 'mention' as const,
          emailSubject: m.emails.subject,
          created_at: m.created_at
        })),
        ...(threads || []).map(t => ({
          id: t.id,
          type: 'thread' as const,
          emailSubject: t.emails.subject,
          created_at: t.created_at
        }))
      ].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());

      setNotifications(formattedNotifications);
    } catch (error) {
      toast.error('Error al cargar notificaciones');
    }
  }

  return (
    <div className="relative">
      <button
        onClick={() => setShowNotifications(!showNotifications)}
        className="relative p-2 text-gray-600 hover:text-gray-900"
      >
        <Bell className="h-6 w-6" />
        {notifications.length > 0 && (
          <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
            {notifications.length}
          </span>
        )}
      </button>

      {showNotifications && (
        <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg z-50">
          <div className="p-4">
            <h3 className="text-lg font-semibold mb-4">Notificaciones</h3>
            {notifications.length === 0 ? (
              <p className="text-gray-500 text-center py-4">No hay notificaciones</p>
            ) : (
              <div className="space-y-3">
                {notifications.map((notification) => (
                  <div
                    key={notification.id}
                    className="flex items-start p-3 bg-gray-50 rounded-lg"
                  >
                    {notification.type === 'mention' ? (
                      <AtSign className="h-5 w-5 text-blue-500 mt-1 mr-2" />
                    ) : (
                      <Hash className="h-5 w-5 text-green-500 mt-1 mr-2" />
                    )}
                    <div>
                      <p className="text-sm font-medium">
                        {notification.type === 'mention' ? 'Te mencionaron' : 'Nuevo tema'}
                      </p>
                      <p className="text-xs text-gray-500">{notification.emailSubject}</p>
                      <p className="text-xs text-gray-400 mt-1">
                        {new Date(notification.created_at).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}