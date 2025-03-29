import React, { useEffect, useState } from 'react';
import { Mail, Search, Send, Trash2, AtSign, Hash } from 'lucide-react';
import { supabase } from '../lib/supabase';
import toast from 'react-hot-toast';
import { Header } from './Header';
import { EmailTemplates } from './EmailTemplates';

interface User {
  id: string;
  email: string;
  created_at: string;
}

export function Dashboard() {
  const [users, setUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState<string[]>([]);
  const [emailSubject, setEmailSubject] = useState('');
  const [emailContent, setEmailContent] = useState('');
  const [showMentionSuggestions, setShowMentionSuggestions] = useState(false);
  const [mentionFilter, setMentionFilter] = useState('');
  const [cursorPosition, setCursorPosition] = useState<number | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  async function fetchUsers() {
    try {
      const { data: users, error } = await supabase
        .from('users')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setUsers(users || []);
    } catch (error) {
      toast.error('Error al cargar usuarios');
    }
  }

  const filteredUsers = users.filter(user =>
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleUserSelect = (userId: string) => {
    setSelectedUsers(prev =>
      prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSendEmail = async () => {
    if (!emailSubject || !emailContent) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    try {
      // Primero enviamos el correo
      const { data: emailData, error: emailError } = await supabase
        .from('emails')
        .insert({
          subject: emailSubject,
          content: emailContent,
          sender_id: (await supabase.auth.getUser()).data.user?.id
        })
        .select()
        .single();

      if (emailError) throw emailError;

      // Procesamos menciones (@)
      const mentionMatches = emailContent.match(/@(\S+)/g) || [];
      for (const mention of mentionMatches) {
        const userEmail = mention.slice(1);
        const mentionedUser = users.find(u => u.email === userEmail);
        if (mentionedUser) {
          await supabase.from('mentions').insert({
            email_id: emailData.id,
            user_id: mentionedUser.id
          });
        }
      }

      // Procesamos temas (#)
      const topicMatches = emailContent.match(/#(\S+)/g) || [];
      for (const topic of topicMatches) {
        await supabase.from('threads').insert({
          email_id: emailData.id,
          topic: topic.slice(1)
        });
      }

      // Enviamos el correo usando la función edge
      const { error: sendError } = await supabase.functions.invoke('send-email', {
        body: {
          to: selectedUsers.map(id => users.find(u => u.id === id)?.email),
          subject: emailSubject,
          content: emailContent,
        },
      });

      if (sendError) throw sendError;
      
      toast.success('Correo enviado exitosamente');
      setEmailSubject('');
      setEmailContent('');
      setSelectedUsers([]);
    } catch (error) {
      toast.error('Error al enviar el correo');
    }
  };

  const handleDeleteUser = async (userId: string) => {
    try {
      const { error } = await supabase
        .from('users')
        .delete()
        .eq('id', userId);

      if (error) throw error;
      
      toast.success('Usuario eliminado exitosamente');
      fetchUsers();
    } catch (error) {
      toast.error('Error al eliminar usuario');
    }
  };

  const handleSelectTemplate = (template: { subject: string; content: string }) => {
    setEmailSubject(template.subject);
    setEmailContent(template.content);
    toast.success('Plantilla cargada');
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const content = e.target.value;
    const position = e.target.selectionStart;
    setEmailContent(content);
    setCursorPosition(position);

    // Detectar si estamos escribiendo una mención
    const beforeCursor = content.slice(0, position);
    const match = beforeCursor.match(/@(\S*)$/);
    
    if (match) {
      setShowMentionSuggestions(true);
      setMentionFilter(match[1]);
    } else {
      setShowMentionSuggestions(false);
      setMentionFilter('');
    }
  };

  const insertMention = (userEmail: string) => {
    if (cursorPosition === null) return;

    const beforeMention = emailContent.slice(0, cursorPosition).replace(/@\S*$/, '');
    const afterMention = emailContent.slice(cursorPosition);
    
    setEmailContent(`${beforeMention}@${userEmail}${afterMention}`);
    setShowMentionSuggestions(false);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <EmailTemplates onSelectTemplate={handleSelectTemplate} />
        
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">Panel de Administración</h1>
          
          {/* Buscador */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Buscar usuarios..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* Lista de Usuarios */}
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Seleccionar
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Fecha de Registro
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredUsers.map((user) => (
                  <tr key={user.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedUsers.includes(user.id)}
                        onChange={() => handleUserSelect(user.id)}
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                      />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <Mail className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm font-medium text-gray-900">{user.email}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => handleDeleteUser(user.id)}
                        className="text-red-600 hover:text-red-900"
                      >
                        <Trash2 className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Formulario de Correo */}
          {selectedUsers.length > 0 && (
            <div className="mt-8 border-t pt-6">
              <h2 className="text-xl font-semibold mb-4">Enviar Correo a Usuarios Seleccionados</h2>
              <div className="space-y-4">
                <input
                  type="text"
                  placeholder="Asunto del correo"
                  value={emailSubject}
                  onChange={(e) => setEmailSubject(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                <div className="relative">
                  <textarea
                    placeholder="Contenido del correo (@para mencionar, #para temas)"
                    value={emailContent}
                    onChange={handleContentChange}
                    rows={4}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  {showMentionSuggestions && (
                    <div className="absolute left-0 right-0 bottom-full mb-2 bg-white rounded-lg shadow-lg border p-2 max-h-40 overflow-y-auto">
                      {users
                        .filter(user => user.email.toLowerCase().includes(mentionFilter.toLowerCase()))
                        .map(user => (
                          <button
                            key={user.id}
                            onClick={() => insertMention(user.email)}
                            className="flex items-center w-full p-2 hover:bg-gray-100 rounded"
                          >
                            <AtSign className="h-4 w-4 text-gray-400 mr-2" />
                            {user.email}
                          </button>
                        ))}
                    </div>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <AtSign className="h-4 w-4" />
                  <span>Menciona usuarios con @</span>
                  <Hash className="h-4 w-4 ml-4" />
                  <span>Crea temas con #</span>
                </div>
                <button
                  onClick={handleSendEmail}
                  className="flex items-center justify-center w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
                >
                  <Send className="h-5 w-5 mr-2" />
                  Enviar Correo ({selectedUsers.length} usuarios seleccionados)
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}