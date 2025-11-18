'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { authService } from '@/lib/api/services/loginService';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Stethoscope, Loader2, Upload, AlertCircle, CheckCircle2, User, Mail, Lock, Phone, MapPin, Calendar, Droplet, Shield, FileText, X, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';

const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  nombres: z.string().min(2, 'El nombre es requerido'),
  apellidos: z.string().min(2, 'El apellido es requerido'),
  tipo_identificacion: z.string().min(1, 'Tipo de identificación requerido'),
  numero_identificacion: z.string().min(5, 'Número de identificación inválido'),
  telefono: z.string().min(10, 'Teléfono inválido'),
  fecha_nacimiento: z.string().min(1, 'La fecha de nacimiento es requerida'),
  genero: z.string().min(1, 'El género es requerido'),
  tipo_sangre: z.string().min(1, 'El tipo de sangre es requerido'),
  alergias: z.string().optional(),
  direccion_completa: z.string().min(5, 'La dirección es requerida'),
  ciudad: z.string().min(2, 'La ciudad es requerida'),
  departamento: z.string().min(2, 'El departamento es requerido'),
});

type RegisterForm = z.infer<typeof registerSchema>;

export default function RegisterPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);
  const [serverError, setServerError] = useState<string | null>(null);
  const [files, setFiles] = useState<File[]>([]);
  const [step, setStep] = useState<'registering' | 'uploading' | null>(null);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<RegisterForm>({
    resolver: zodResolver(registerSchema),
  });

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (data: RegisterForm) => {
    setIsLoading(true);
    setServerError(null);
    setLoadingProgress(0);
    setStep('registering');

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 45) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 5;
      });
    }, 100);

    try {
      // Preparar alergias como array
      const alergiasArray = data.alergias
        ? data.alergias.split(',').map((a) => a.trim()).filter((a) => a.length > 0)
        : [];

      // Estructura según tu backend
      const registerData = {
        usuario: {
          email: data.email,
          password: data.password,
        },
        paciente: {
          nombres: data.nombres,
          apellidos: data.apellidos,
          tipo_identificacion: data.tipo_identificacion,
          numero_identificacion: data.numero_identificacion,
          telefono: data.telefono,
          tipo_sangre: data.tipo_sangre,
          alergias: alergiasArray,
          fecha_nacimiento: data.fecha_nacimiento,
          genero: data.genero,
        },
        direccion: {
          tipo: 'RESIDENCIA',
          direccion_completa: data.direccion_completa,
          ciudad: data.ciudad,
          departamento: data.departamento,
          es_principal: true,
        },
      };

      const response = await authService.register(registerData);
      if (response.success && response.data.solicitud_id) {
        await authService.validacionAutomatica(response.data.solicitud_id);
      }
      setLoadingProgress(50);

      // Si hay documentos, subirlos
      if (files.length > 0 && response.data.solicitud_id) {
        setStep('uploading');
        setLoadingProgress(60);

        await authService.uploadDocuments(response.data.solicitud_id, files);
        setLoadingProgress(100);
      } else {
        setLoadingProgress(100);
      }

      setTimeout(() => {
        toast.success('¡Registro exitoso!', {
          icon: <CheckCircle2 className="w-5 h-5" />,
          description: 'Tu solicitud está siendo revisada. Te notificaremos pronto.',
        });
        router.push('/login');
      }, 500);
    } catch (error: any) {
      clearInterval(progressInterval);
      setLoadingProgress(0);

      const errorMessage =
        error.response?.data?.message ||
        error.response?.data?.error ||
        'Error al registrarse. Por favor, intenta nuevamente.';

      setServerError(errorMessage);

      toast.error('Error en el registro', {
        icon: <AlertCircle className="w-5 h-5" />,
        description: errorMessage,
        duration: 5000,
      });

      setTimeout(() => {
        setServerError(null);
      }, 5000);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
        setStep(null);
      }, 600);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 py-12 px-6 relative overflow-hidden">
      {/* Elementos decorativos */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-300 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
        <div className="absolute top-1/2 right-20 w-2 h-2 bg-blue-400 rounded-full animate-ping opacity-30"></div>
        <div className="absolute bottom-1/4 left-20 w-2 h-2 bg-teal-400 rounded-full animate-ping opacity-30" style={{ animationDelay: '1s' }}></div>
      </div>

      <div className="max-w-4xl mx-auto relative z-10">
        {/* Logo y título */}
        <div className="text-center mb-10">
          <Link href="/" className="inline-flex items-center space-x-3 mb-4 group">
            <div className="relative">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl blur-md opacity-60 group-hover:opacity-80 transition-opacity"></div>
              <div className="relative w-16 h-16 bg-gradient-to-br from-blue-600 via-blue-500 to-cyan-500 rounded-2xl flex items-center justify-center shadow-xl transform transition-all duration-300 group-hover:scale-110 group-hover:rotate-6">
                <Stethoscope className="w-9 h-9 text-white" strokeWidth={2.5} />
                <Sparkles className="absolute -top-1 -right-1 w-4 h-4 text-yellow-300 animate-pulse" />
              </div>
            </div>
            <div>
              <span className="text-4xl font-bold bg-gradient-to-r from-blue-700 via-blue-600 to-cyan-600 bg-clip-text text-transparent block">
                SaludK
              </span>
              <span className="text-xs font-semibold text-blue-600/70 tracking-wider uppercase">
                Health Platform
              </span>
            </div>
          </Link>
          <p className="text-slate-600 text-sm font-medium mt-3 flex items-center justify-center gap-2">
            <Shield className="w-4 h-4 text-blue-500" />
            Registro Seguro de Pacientes
          </p>
        </div>

        {/* Card principal */}
        <Card className="shadow-2xl border border-blue-100/50 backdrop-blur-xl bg-white/95 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>

          <CardHeader className="space-y-3 pb-6 pt-8">
            <CardTitle className="text-3xl font-bold text-slate-800 text-center bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">
              Registro de Paciente
            </CardTitle>
            <CardDescription className="text-center text-slate-600 text-base">
              Completa el formulario con tus datos personales y médicos para comenzar
            </CardDescription>
          </CardHeader>

          <CardContent className="space-y-8 pb-8 px-8">
            {/* Error del servidor */}
            {serverError && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300 border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="ml-2 text-sm font-medium">
                  {serverError}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              {/* Información de Cuenta */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-100">
                  <Lock className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Información de Cuenta</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-1">
                    <Label htmlFor="email" className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                      <Mail className="w-4 h-4 text-blue-600" />
                      Correo Electrónico
                    </Label>
                    <div className="relative group">
                      <Input
                        id="email"
                        type="email"
                        placeholder="tu@email.com"
                        className={`h-11 border-2 transition-all duration-200 ${
                          errors.email ? 'border-red-300' : 'border-slate-200 focus:border-blue-500'
                        }`}
                        {...register('email')}
                        disabled={isLoading}
                      />
                    </div>
                    {errors.email && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.email.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="password" className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                      <Lock className="w-4 h-4 text-blue-600" />
                      Contraseña
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      placeholder="Mínimo 6 caracteres"
                      className={`h-11 border-2 ${
                        errors.password ? 'border-red-300' : 'border-slate-200 focus:border-blue-500'
                      }`}
                      {...register('password')}
                      disabled={isLoading}
                    />
                    {errors.password && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.password.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Información Personal */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-100">
                  <User className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Información Personal</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2">
                    <Label htmlFor="nombres" className="text-slate-700 font-semibold text-sm">Nombres</Label>
                    <Input
                      id="nombres"
                      placeholder="Tu nombre completo"
                      className={`h-11 border-2 ${errors.nombres ? 'border-red-300' : 'border-slate-200'}`}
                      {...register('nombres')}
                      disabled={isLoading}
                    />
                    {errors.nombres && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.nombres.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="apellidos" className="text-slate-700 font-semibold text-sm">Apellidos</Label>
                    <Input
                      id="apellidos"
                      placeholder="Tus apellidos"
                      className={`h-11 border-2 ${errors.apellidos ? 'border-red-300' : 'border-slate-200'}`}
                      {...register('apellidos')}
                      disabled={isLoading}
                    />
                    {errors.apellidos && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.apellidos.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_identificacion" className="text-slate-700 font-semibold text-sm">Tipo de Identificación</Label>
                    <Select onValueChange={(value) => setValue('tipo_identificacion', value)} disabled={isLoading}>
                      <SelectTrigger className={`h-11 border-2 ${errors.tipo_identificacion ? 'border-red-300' : 'border-slate-200'}`}>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CC">Cédula de Ciudadanía</SelectItem>
                        <SelectItem value="TI">Tarjeta de Identidad</SelectItem>
                        <SelectItem value="CE">Cédula de Extranjería</SelectItem>
                        <SelectItem value="PA">Pasaporte</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.tipo_identificacion && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.tipo_identificacion.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="numero_identificacion" className="text-slate-700 font-semibold text-sm">Número de Identificación</Label>
                    <Input
                      id="numero_identificacion"
                      placeholder="1234567890"
                      className={`h-11 border-2 ${errors.numero_identificacion ? 'border-red-300' : 'border-slate-200'}`}
                      {...register('numero_identificacion')}
                      disabled={isLoading}
                    />
                    {errors.numero_identificacion && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.numero_identificacion.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="telefono" className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-600" />
                      Teléfono
                    </Label>
                    <Input
                      id="telefono"
                      placeholder="3001234567"
                      className={`h-11 border-2 ${errors.telefono ? 'border-red-300' : 'border-slate-200'}`}
                      {...register('telefono')}
                      disabled={isLoading}
                    />
                    {errors.telefono && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.telefono.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="fecha_nacimiento" className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-blue-600" />
                      Fecha de Nacimiento
                    </Label>
                    <Input
                      id="fecha_nacimiento"
                      type="date"
                      className={`h-11 border-2 ${errors.fecha_nacimiento ? 'border-red-300' : 'border-slate-200'}`}
                      {...register('fecha_nacimiento')}
                      disabled={isLoading}
                    />
                    {errors.fecha_nacimiento && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.fecha_nacimiento.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="genero" className="text-slate-700 font-semibold text-sm">Género</Label>
                    <Select onValueChange={(value) => setValue('genero', value)} disabled={isLoading}>
                      <SelectTrigger className={`h-11 border-2 ${errors.genero ? 'border-red-300' : 'border-slate-200'}`}>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Masculino">Masculino</SelectItem>
                        <SelectItem value="Femenino">Femenino</SelectItem>
                        <SelectItem value="Otro">Otro</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.genero && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.genero.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tipo_sangre" className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                      <Droplet className="w-4 h-4 text-red-500" />
                      Tipo de Sangre
                    </Label>
                    <Select onValueChange={(value) => setValue('tipo_sangre', value)} disabled={isLoading}>
                      <SelectTrigger className={`h-11 border-2 ${errors.tipo_sangre ? 'border-red-300' : 'border-slate-200'}`}>
                        <SelectValue placeholder="Selecciona..." />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="O+">O+</SelectItem>
                        <SelectItem value="O-">O-</SelectItem>
                        <SelectItem value="A+">A+</SelectItem>
                        <SelectItem value="A-">A-</SelectItem>
                        <SelectItem value="B+">B+</SelectItem>
                        <SelectItem value="B-">B-</SelectItem>
                        <SelectItem value="AB+">AB+</SelectItem>
                        <SelectItem value="AB-">AB-</SelectItem>
                      </SelectContent>
                    </Select>
                    {errors.tipo_sangre && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.tipo_sangre.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Dirección */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-100">
                  <MapPin className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Dirección de Residencia</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div className="space-y-2 md:col-span-2">
                    <Label htmlFor="direccion_completa" className="text-slate-700 font-semibold text-sm">Dirección Completa</Label>
                    <Input
                      id="direccion_completa"
                      placeholder="Calle 123 #45-67 Apto 301"
                      className={`h-11 border-2 ${errors.direccion_completa ? 'border-red-300' : 'border-slate-200'}`}
                      {...register('direccion_completa')}
                      disabled={isLoading}
                    />
                    {errors.direccion_completa && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.direccion_completa.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="ciudad" className="text-slate-700 font-semibold text-sm">Ciudad</Label>
                    <Input
                      id="ciudad"
                      placeholder="Bogotá"
                      className={`h-11 border-2 ${errors.ciudad ? 'border-red-300' : 'border-slate-200'}`}
                      {...register('ciudad')}
                      disabled={isLoading}
                    />
                    {errors.ciudad && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.ciudad.message}</p>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="departamento" className="text-slate-700 font-semibold text-sm">Departamento</Label>
                    <Input
                      id="departamento"
                      placeholder="Cundinamarca"
                      className={`h-11 border-2 ${errors.departamento ? 'border-red-300' : 'border-slate-200'}`}
                      {...register('departamento')}
                      disabled={isLoading}
                    />
                    {errors.departamento && (
                      <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-2 rounded-md border border-red-100">
                        <AlertCircle className="w-4 h-4" />
                        <p className="text-sm font-medium">{errors.departamento.message}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Información Médica */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-100">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Información Médica (Opcional)</h3>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="alergias" className="text-slate-700 font-semibold text-sm">Alergias</Label>
                  <Textarea
                    id="alergias"
                    placeholder="Separa múltiples alergias con comas. Ej: Polen, Ácaros, Penicilina"
                    className="border-2 border-slate-200 min-h-[80px]"
                    {...register('alergias')}
                    disabled={isLoading}
                  />
                  <p className="text-xs text-slate-500">Usa comas para separar múltiples alergias</p>
                </div>
              </div>

              {/* Documentos */}
              <div className="space-y-5">
                <div className="flex items-center gap-2 pb-2 border-b-2 border-blue-100">
                  <Upload className="w-5 h-5 text-blue-600" />
                  <h3 className="text-lg font-bold text-slate-800">Documentos (Opcional)</h3>
                </div>

                <div className="space-y-4">
                  <div className="border-2 border-dashed border-blue-300 rounded-xl p-8 text-center hover:border-blue-500 hover:bg-blue-50/50 transition-all cursor-pointer relative group">
                    <input
                      id="documentos"
                      type="file"
                      multiple
                      accept=".pdf,.jpg,.jpeg,.png"
                      onChange={handleFileChange}
                      disabled={isLoading}
                      className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                    />
                    <Upload className="w-12 h-12 mx-auto mb-3 text-blue-500 group-hover:scale-110 transition-transform" />
                    <p className="text-sm font-semibold text-slate-700 mb-1">
                      Haz clic o arrastra archivos aquí
                    </p>
                    <p className="text-xs text-slate-500">
                      PDF, JPG o PNG (máx. 5MB cada uno)
                    </p>
                  </div>

                  {files.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-slate-700">Archivos seleccionados:</p>
                      <div className="space-y-2">
                        {files.map((file, index) => (
                          <div key={index} className="flex items-center justify-between p-3 bg-blue-50 border border-blue-200 rounded-lg">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <span className="text-sm font-medium text-slate-700">{file.name}</span>
                              <span className="text-xs text-slate-500">({(file.size / 1024).toFixed(1)} KB)</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFile(index)}
                              className="text-red-500 hover:text-red-700 transition-colors"
                              disabled={isLoading}
                            >
                              <X className="w-5 h-5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Barra de progreso */}
              {isLoading && (
                <div className="space-y-3 py-2">
                  <div className="relative w-full bg-slate-200 rounded-full h-2.5 overflow-hidden shadow-inner">
                    <div 
                      className="h-full bg-gradient-to-r from-blue-600 via-cyan-500 to-teal-500 transition-all duration-300 ease-out rounded-full relative"
                      style={{ width: `${loadingProgress}%` }}
                    >
                      <div className="absolute inset-0 bg-white/30 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 text-blue-600 animate-spin" />
                    <p className="text-xs text-slate-600 font-semibold">
                      {step === 'registering' && 'Registrando tus datos...'}
                      {step === 'uploading' && 'Subiendo documentos...'}
                      {!step && 'Procesando...'}
                    </p>
                  </div>
                </div>
              )}

              {/* Botón de envío */}
              <Button
                type="submit"
                className="w-full h-13 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-bold text-base shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Registrando...
                  </>
                ) : (
                  <>
                    <CheckCircle2 className="w-5 h-5 mr-2" />
                    Completar Registro
                  </>
                )}
              </Button>
            </form>

            {/* Divider */}
            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
            </div>

            {/* Link de login */}
            <div className="text-center">
              <p className="text-sm text-slate-600">
                ¿Ya tienes una cuenta?{' '}
                <Link 
                  href="/login" 
                  className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors inline-flex items-center gap-1"
                >
                  Inicia sesión aquí
                  <span className="text-lg">→</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-center space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Al registrarte, aceptas nuestros{' '}
            <Link href="/terms" className="text-blue-600 hover:underline font-semibold">
              Términos de Servicio
            </Link>{' '}
            y{' '}
            <Link href="/privacy" className="text-blue-600 hover:underline font-semibold">
              Política de Privacidad
            </Link>
          </p>
          <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
            <Shield className="w-3 h-3" />
            <span>Tus datos están protegidos y encriptados</span>
          </div>
        </div>
      </div>
    </div>
  );
}