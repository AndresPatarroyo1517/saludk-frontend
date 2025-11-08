'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Stethoscope, Loader2, AlertCircle, CheckCircle2, Eye, EyeOff, Lock, Mail, Shield, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ROLE_REDIRECTS } from '@/lib/auth.config';

const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres'),
  rememberMe: z.boolean().optional(),
});

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage() {
  const router = useRouter();
  const { login, isAuthenticated, isLoading: authLoading } = useAuth();
  const [showPassword, setShowPassword] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingProgress, setLoadingProgress] = useState(0);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      rememberMe: false,
    },
  });

  const rememberMe = watch('rememberMe');

  // ✅ FIX CRÍTICO: Agregar isAuthenticated a dependencias
  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      console.log('✅ Usuario autenticado, redirigiendo a dashboard');
      router.replace('/dashboard');
    }
  }, [authLoading, isAuthenticated, router]); // ✅ CORREGIDO

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    setServerError(null);
    setLoadingProgress(0);

    const progressInterval = setInterval(() => {
      setLoadingProgress((prev) => {
        if (prev >= 90) {
          clearInterval(progressInterval);
          return prev;
        }
        return prev + 10;
      });
    }, 100);

    try {
      console.log('🔐 Intentando login...');
      const response = await login(data.email, data.password, data.rememberMe || false);
      
      setLoadingProgress(100);
      clearInterval(progressInterval);
      
      console.log('✅ Login exitoso:', response);
      
      if (data.rememberMe) {
        localStorage.setItem('rememberMe', 'true');
      }
      
      // ✅ El login actualizó el store, el useEffect manejará la redirección
      toast.success('¡Bienvenido de nuevo!', {
        icon: <CheckCircle2 className="w-5 h-5" />,
        description: 'Has iniciado sesión correctamente',
      });

    } catch (error: any) {
      clearInterval(progressInterval);
      setLoadingProgress(0);
      
      console.error('❌ Error en login:', error);
      
      const errorMessage = error.response?.data?.message || 
                          error.response?.data?.error ||
                          error.message ||
                          'Error al iniciar sesión. Por favor, verifica tus credenciales.';
      
      setServerError(errorMessage);
      
      toast.error('Error de autenticación', {
        icon: <AlertCircle className="w-5 h-5" />,
        description: errorMessage,
        duration: 4000,
      });

      setTimeout(() => {
        setServerError(null);
      }, 5000);
    } finally {
      setTimeout(() => {
        setIsLoading(false);
      }, 600);
    }
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-blue-600 animate-spin mx-auto mb-4" />
          <p className="text-slate-600 font-medium">Verificando sesión...</p>
        </div>
      </div>
    );
  }

  if (isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 flex items-center justify-center p-6 relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-96 h-96 bg-gradient-to-br from-blue-300 to-cyan-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-gradient-to-br from-teal-300 to-blue-300 rounded-full mix-blend-multiply filter blur-3xl opacity-40 animate-pulse" style={{ animationDelay: '2s' }}></div>
      </div>

      <div className="w-full max-w-md relative z-10">
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
            Plataforma Segura de Gestión Médica
          </p>
        </div>

        <Card className="shadow-2xl border border-blue-100/50 backdrop-blur-xl bg-white/95 relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-blue-500 via-cyan-500 to-teal-500"></div>
          
          <CardHeader className="space-y-3 pb-8 pt-8">
            <CardTitle className="text-3xl font-bold text-slate-800 text-center bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text">
              Iniciar Sesión
            </CardTitle>
            <CardDescription className="text-center text-slate-600 text-base">
              Accede a tu cuenta para gestionar tu información médica de forma segura
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-6 pb-8 px-8">
            {serverError && (
              <Alert variant="destructive" className="animate-in slide-in-from-top-2 duration-300 border-red-200 bg-red-50">
                <AlertCircle className="h-5 w-5" />
                <AlertDescription className="ml-2 text-sm font-medium">
                  {serverError}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="email" className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                  <Mail className="w-4 h-4 text-blue-600" />
                  Correo Electrónico
                </Label>
                <div className="relative group">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg opacity-0 group-focus-within:opacity-20 blur transition duration-200`}></div>
                  <div className="relative">
                    <Mail className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <Input
                      id="email"
                      type="email"
                      placeholder="usuario@ejemplo.com"
                      className={`pl-11 h-12 border-2 transition-all duration-200 bg-white text-slate-800 placeholder:text-slate-400 ${
                        errors.email 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      {...register('email')}
                      disabled={isLoading}
                    />
                  </div>
                </div>
                {errors.email && (
                  <div className="flex items-center space-x-2 text-red-600 animate-in slide-in-from-top-1 duration-200 bg-red-50 p-2 rounded-md border border-red-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm font-medium">{errors.email.message}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-700 font-semibold text-sm flex items-center gap-2">
                  <Lock className="w-4 h-4 text-blue-600" />
                  Contraseña
                </Label>
                <div className="relative group">
                  <div className={`absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-cyan-500 rounded-lg opacity-0 group-focus-within:opacity-20 blur transition duration-200`}></div>
                  <div className="relative">
                    <Lock className="absolute left-3.5 top-1/2 transform -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-blue-500" />
                    <Input
                      id="password"
                      type={showPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      className={`pl-11 pr-12 h-12 border-2 transition-all duration-200 bg-white text-slate-800 placeholder:text-slate-400 ${
                        errors.password 
                          ? 'border-red-300 focus:border-red-500 focus:ring-red-200' 
                          : 'border-slate-200 focus:border-blue-500 focus:ring-blue-100'
                      }`}
                      {...register('password')}
                      disabled={isLoading}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3.5 top-1/2 transform -translate-y-1/2 text-slate-400 hover:text-blue-600 transition-colors focus:outline-none"
                      disabled={isLoading}
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
                {errors.password && (
                  <div className="flex items-center space-x-2 text-red-600 animate-in slide-in-from-top-1 duration-200 bg-red-50 p-2 rounded-md border border-red-100">
                    <AlertCircle className="w-4 h-4 flex-shrink-0" />
                    <p className="text-sm font-medium">{errors.password.message}</p>
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between pt-1">
                <div className="flex items-center space-x-2">
                  <Checkbox 
                    id="rememberMe" 
                    {...register('rememberMe')}
                    className="border-2 border-slate-300 data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                    disabled={isLoading}
                  />
                  <label htmlFor="rememberMe" className="text-sm font-medium text-slate-700 cursor-pointer select-none">
                    Recuérdame
                  </label>
                </div>
                <Link href="/forgot-password" className="text-sm font-semibold text-blue-600 hover:text-blue-700 hover:underline transition-colors">
                  ¿Olvidaste tu contraseña?
                </Link>
              </div>

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
                      Verificando credenciales...
                    </p>
                  </div>
                </div>
              )}

              <Button
                type="submit"
                className="w-full h-13 bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-600 hover:from-blue-700 hover:via-blue-600 hover:to-cyan-700 text-white font-bold text-base shadow-xl hover:shadow-2xl transform transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none relative overflow-hidden group"
                disabled={isLoading}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/20 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000"></div>
                {isLoading ? (
                  <>
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                    Iniciando sesión...
                  </>
                ) : (
                  <>
                    <Lock className="w-5 h-5 mr-2" />
                    Iniciar Sesión
                  </>
                )}
              </Button>
            </form>

            <div className="relative py-4">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-slate-200"></div>
              </div>
              <div className="relative flex justify-center text-xs uppercase">
                <span className="bg-white px-3 text-slate-500 font-semibold">
                  o continúa con
                </span>
              </div>
            </div>

            <div className="text-center">
              <p className="text-sm text-slate-600">
                ¿No tienes una cuenta?{' '}
                <Link href="/register" className="text-blue-600 hover:text-blue-700 font-bold hover:underline transition-colors inline-flex items-center gap-1">
                  Regístrate aquí
                  <span className="text-lg">→</span>
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="mt-8 text-center space-y-3">
          <p className="text-xs text-slate-500 leading-relaxed">
            Al iniciar sesión, aceptas nuestros{' '}
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
            <span>Conexión segura SSL • Datos encriptados</span>
          </div>
        </div>
      </div>
    </div>
  );
}