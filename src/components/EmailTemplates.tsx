import React, { useState } from 'react';
import { Save, Send, BookTemplate as Template } from 'lucide-react';
import toast from 'react-hot-toast';

interface EmailTemplate {
  name: string;
  subject: string;
  content: string;
}

interface EmailTemplatesProps {
  onSelectTemplate: (template: EmailTemplate) => void;
}

export function EmailTemplates({ onSelectTemplate }: EmailTemplatesProps) {
  const [templates, setTemplates] = useState<EmailTemplate[]>([
    {
      name: 'Bienvenida',
      subject: '¡Bienvenido a nuestra plataforma!',
      content: 'Estimado usuario,\n\nGracias por registrarte en nuestra plataforma. Estamos emocionados de tenerte con nosotros.\n\nSaludos cordiales,\nEl equipo'
    },
    {
      name: 'Actualización',
      subject: 'Actualización importante del sistema',
      content: 'Estimado usuario,\n\nQueremos informarte sobre una actualización importante en nuestro sistema.\n\nSaludos cordiales,\nEl equipo'
    }
  ]);

  const [newTemplate, setNewTemplate] = useState<EmailTemplate>({
    name: '',
    subject: '',
    content: ''
  });

  const [isAddingTemplate, setIsAddingTemplate] = useState(false);

  const handleSaveTemplate = () => {
    if (!newTemplate.name || !newTemplate.subject || !newTemplate.content) {
      toast.error('Por favor completa todos los campos');
      return;
    }

    setTemplates([...templates, newTemplate]);
    setNewTemplate({ name: '', subject: '', content: '' });
    setIsAddingTemplate(false);
    toast.success('Plantilla guardada exitosamente');
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6">
      <h2 className="text-xl font-semibold mb-4 flex items-center">
        <Template className="h-5 w-5 mr-2" />
        Plantillas de Correo
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
        {templates.map((template, index) => (
          <div key={index} className="border rounded-lg p-4 hover:border-blue-500 transition-colors">
            <h3 className="font-medium mb-2">{template.name}</h3>
            <p className="text-sm text-gray-600 mb-2 truncate">{template.subject}</p>
            <p className="text-sm text-gray-500 mb-4 line-clamp-3">{template.content}</p>
            <button
              onClick={() => onSelectTemplate(template)}
              className="flex items-center text-blue-600 hover:text-blue-800 text-sm"
            >
              <Send className="h-4 w-4 mr-1" />
              Usar plantilla
            </button>
          </div>
        ))}
      </div>

      {!isAddingTemplate ? (
        <button
          onClick={() => setIsAddingTemplate(true)}
          className="text-blue-600 hover:text-blue-800 text-sm flex items-center"
        >
          <Template className="h-4 w-4 mr-1" />
          Agregar nueva plantilla
        </button>
      ) : (
        <div className="border rounded-lg p-4">
          <h3 className="font-medium mb-4">Nueva Plantilla</h3>
          <div className="space-y-4">
            <input
              type="text"
              placeholder="Nombre de la plantilla"
              value={newTemplate.name}
              onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <input
              type="text"
              placeholder="Asunto del correo"
              value={newTemplate.subject}
              onChange={(e) => setNewTemplate({ ...newTemplate, subject: e.target.value })}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <textarea
              placeholder="Contenido del correo"
              value={newTemplate.content}
              onChange={(e) => setNewTemplate({ ...newTemplate, content: e.target.value })}
              rows={4}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="flex space-x-2">
              <button
                onClick={handleSaveTemplate}
                className="flex items-center justify-center bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition duration-200"
              >
                <Save className="h-4 w-4 mr-1" />
                Guardar
              </button>
              <button
                onClick={() => setIsAddingTemplate(false)}
                className="text-gray-600 hover:text-gray-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}