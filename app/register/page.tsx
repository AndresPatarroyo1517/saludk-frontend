'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '@/lib/api/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Loader2, Upload } from 'lucide-react';
import { toast } from 'sonner';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombre: z.string().min(2, 'El nombre es requerido'),
  apellido: z.string().min(2, 'El apellido es requerido'),
  telefono: z.string().min(10, 'Teléfono inválido'),
  direccion: z.string().min(5, 'La dirección es requerida'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  tipo_sangre: z.string().min(1, 'El tipo de sangre es requerido'),
  alergias: z.string().optional(),
  enfermedades_cronicas: z.string().optional(),
  medicamentos_actuales: z.string().optional(),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [files, setFiles] = useState<FileList | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    try {
      const formData = new FormData();
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value.toString());
      });

      if (files) {
        Array.from(files).forEach((file) => {
          formData.append('documentos', file);
        });
      }

      await authService.register(formData);
      toast.success('Registro exitoso. Tu solicitud está siendo revisada.');
      router.push('/login');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al registrarse');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50 py-12 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-8">
          <Link href="/" className="inline-flex items-center space-x-2 mb-6">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-7 h-7 text-white" />
            </div>
            <span className="text-3xl font-bold text-slate-800">SaludK</span>
          </Link>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-2xl">Registro de Paciente</CardTitle>
            <CardDescription>
              Completa el formulario con tus datos personales y médicos
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Información Personal</h3>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="nombre">Nombre</Label>
                    <Input
                      id="nombre"
                      {...register('nombre')}
                      disabled={isLoading}
                    />
                    {errors.nombre && (
                      <p className="text-sm text-red-500">{errors.nombre.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellido">Apellido</Label>
                    <Input
                      id="apellido"
                      {...register('apellido')}
                      disabled={isLoading}
                    />
                    {errors.apellido && (
                      <p className="text-sm text-red-500">{errors.apellido.message}</p>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      {...register('email')}
                      disabled={isLoading}
                    />
                    {errors.email && (
                      <p className="text-sm text-red-500">{errors.email.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono">Teléfono</Label>
                    <Input
                      id="telefono"
                      {...register('telefono')}
                      disabled={isLoading}
                    />
                    {errors.telefono && (
                      <p className="text-sm text-red-500">{errors.telefono.message}</p>
                    )}
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Contraseña</Label>
                  <Input
                    id="password"
                    type="password"
                    {...register('password')}
                    disabled={isLoading}
                  />
                  {errors.password && (
                    <p className="text-sm text-red-500">{errors.password.message}</p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="direccion">Dirección</Label>
                  <Input
                    id="direccion"
                    {...register('direccion')}
                    disabled={isLoading}
                  />
                  {errors.direccion && (
                    <p className="text-sm text-red-500">{errors.direccion.message}</p>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="fecha_nacimiento">Fecha de Nacimiento</Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      {...register('fecha_nacimiento')}
                      disabled={isLoading}
                    />
                    {errors.fecha_nacimiento && (
                      <p className="text-sm text-red-500">{errors.fecha_nacimiento.message}</p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_sangre">Tipo de Sangre</Label>
                    <Input
                      id="tipo_sangre"
                      placeholder="O+, A-, etc."
                      {...register('tipo_sangre')}
                      disabled={isLoading}
                    />
                    {errors.tipo_sangre && (
                      <p className="text-sm text-red-500">{errors.tipo_sangre.message}</p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-slate-800">Información Médica</h3>

                <div className="space-y-2">
                  <Label htmlFor="alergias">Alergias (opcional)</Label>
                  <Textarea
                    id="alergias"
                    placeholder="Describe cualquier alergia que tengas"
                    {...register('alergias')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="enfermedades_cronicas">Enfermedades Crónicas (opcional)</Label>
                  <Textarea
                    id="enfermedades_cronicas"
                    placeholder="Describe enfermedades crónicas si las tienes"
                    {...register('enfermedades_cronicas')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="medicamentos_actuales">Medicamentos Actuales (opcional)</Label>
                  <Textarea
                    id="medicamentos_actuales"
                    placeholder="Lista de medicamentos que estás tomando actualmente"
                    {...register('medicamentos_actuales')}
                    disabled={isLoading}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="documentos">Documentos Médicos (opcional)</Label>
                  <div className="border-2 border-dashed border-slate-300 rounded-lg p-6 text-center hover:border-blue-400 transition">
                    <Upload className="w-8 h-8 mx-auto mb-2 text-slate-400" />
                    <Input
                      id="documentos"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={(e) => setFiles(e.target.files)}
                      disabled={isLoading}
                      className="hidden"
                    />
                    <Label
                      htmlFor="documentos"
                      className="cursor-pointer text-sm text-slate-600"
                    >
                      {files && files.length > 0
                        ? `${files.length} archivo(s) seleccionado(s)`
                        : 'Haz clic para subir archivos o arrástralos aquí'}
                    </Label>
                    <p className="text-xs text-slate-500 mt-2">
                      PDF, JPG o PNG (máx. 5MB cada uno)
                    </p>
                  </div>
                </div>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  'Completar Registro'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm">
              <p className="text-slate-600">
                ¿Ya tienes una cuenta?{' '}
                <Link href="/login" className="text-blue-600 hover:underline font-medium">
                  Inicia sesión aquí
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
