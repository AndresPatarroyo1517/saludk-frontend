import apiClient from '../client';

const tryPaths = [
  (id: string) => `/pacientes/usuario/${id}`,
  (id: string) => `/paciente/usuario/${id}`,
  (id: string) => `/pacientes/by-usuario/${id}`,
  (id: string) => `/paciente/by-usuario/${id}`,
  (id: string) => `/paciente/${id}`,
  (id: string) => `/pacientes/${id}`,
];

const pacienteService = {
  // intenta obtener el paciente por usuario_id o por id
  getByUsuarioId: async (usuarioId: string) => {
    for (const p of tryPaths) {
      try {
        const path = p(usuarioId);
        const resp = await apiClient.get(path);
        const data = resp.data;
        // posibles estructuras
        if (!data) continue;
        if (data.paciente) return data.paciente;
        if (data.data && data.data.paciente) return data.data.paciente;
        if (Array.isArray(data) && data.length > 0) return data[0];
        // si devuelve un objeto con id -> asumir es el paciente
        if (data.id) return data;
        // si devuelve data.pacientes array
        if (data.data && Array.isArray(data.data)) return data.data[0];
      } catch (err) {
        // ignorar y probar siguiente path
      }
    }

    // si ninguno funcionó, lanzar error para que el caller lo maneje
    throw new Error('Paciente no encontrado por usuario id');
  }
,

  // intenta crear un paciente mínimo para un usuario existente
  createForUsuario: async (usuarioId: string, data?: { nombres?: string; apellidos?: string; numero_identificacion?: string; tipo_identificacion?: string; telefono?: string }) => {
    const body = {
      usuario_id: usuarioId,
      nombres: data?.nombres || 'Paciente',
      apellidos: data?.apellidos || 'Creado',
      numero_identificacion: data?.numero_identificacion || '0000000000',
      tipo_identificacion: data?.tipo_identificacion || 'CC',
      telefono: data?.telefono || null
    };

    const tryCreatePaths = [
      '/pacientes',
      '/paciente',
      `/pacientes/usuario/${usuarioId}`,
      `/paciente/usuario/${usuarioId}`
    ];

    for (const path of tryCreatePaths) {
      try {
        const resp = await apiClient.post(path, body);
        const d = resp.data;
        if (d && (d.paciente || d.data || d.id)) {
          if (d.paciente) return d.paciente;
          if (d.data && d.data.paciente) return d.data.paciente;
          if (d.id) return d;
        }
        // fallback: if resp.data is object assume it's the paciente
        if (d && typeof d === 'object') return d;
      } catch (err) {
        // ignorar y probar siguiente path
      }
    }

    throw new Error('No se pudo crear paciente desde frontend');
  }
};

export default pacienteService;