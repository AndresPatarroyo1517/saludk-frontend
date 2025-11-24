'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  Stethoscope,
  Calendar,
  ShoppingBag,
  FileText,
  Shield,
  Clock,
  CheckCircle,
  Sparkles,
  Heart,
  Star,
  ArrowRight,
  Play,
  Users,
  Award,
  Zap
} from 'lucide-react';
import { useAuthStore } from '@/lib/store/authStore';
import { planesService } from '@/lib/api/services/planesService';

interface Plan {
  id: string;
  nombre: string;
  codigo: string;
  descripcion: string;
  precio_mensual: string;
  duracion_meses: string;
  beneficios: string[];
  consultas_virtuales_incluidas: string;
  consultas_presenciales_incluidas: string;
}

export default function Home() {
  const { isAuthenticated, user } = useAuthStore();
  const [planes, setPlanes] = useState<Plan[]>([]);
  const [loadingPlanes, setLoadingPlanes] = useState(true);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    const cargarPlanes = async () => {
      try {
        const response = await planesService.getPlanes();
        setPlanes(response.data);
      } catch (error) {
        console.error('Error cargando planes:', error);
      } finally {
        setLoadingPlanes(false);
      }
    };

    cargarPlanes();
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-cyan-50">
      {/* Header Mejorado */}
      <header className="border-b bg-white/90 backdrop-blur-xl sticky top-0 z-50 shadow-sm">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-2xl flex items-center justify-center shadow-lg group-hover:shadow-xl transition-all duration-300">
              <Heart className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                SaludK
              </span>
              <div className="h-1 w-0 group-hover:w-full bg-gradient-to-r from-blue-600 to-cyan-500 transition-all duration-300 rounded-full"></div>
            </div>
          </Link>

          <nav className="hidden lg:flex items-center space-x-8">
            <Link href="#servicios" className="text-slate-700 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105">
              Servicios
            </Link>
            <Link href="#planes" className="text-slate-700 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105">
              Planes
            </Link>
            <Link href="#beneficios" className="text-slate-700 hover:text-blue-600 transition-all duration-300 font-medium hover:scale-105">
              Beneficios
            </Link>
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <span className="text-slate-600 bg-slate-100 px-4 py-2 rounded-full font-medium">
                  👋 Bienvenido, {user?.datos_personales?.nombres || 'Usuario'}
                </span>
                <Link href="/dashboard">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300">
                    Ir al Dashboard
                    <ArrowRight className="w-4 h-4 ml-2" />
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Link href="/login">
                  <Button variant="outline" className="border-slate-300 hover:border-blue-500 transition-all duration-300">
                    Iniciar Sesión
                  </Button>
                </Link>
                <Link href="/register">
                  <Button className="bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl transition-all duration-300">
                    Comenzar Gratis
                  </Button>
                </Link>
              </div>
            )}
          </nav>

          <div className="lg:hidden flex items-center space-x-3">
            {isAuthenticated ? (
              <Link href="/dashboard">
                <Button size="sm" className="bg-gradient-to-r from-blue-600 to-cyan-500">
                  Dashboard
                </Button>
              </Link>
            ) : (
              <Link href="/login">
                <Button variant="outline" size="sm">Ingresar</Button>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* Hero Section Mejorada */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-cyan-400/5"></div>
        <div className="container mx-auto px-6 py-24 lg:py-32 text-center relative z-10">
          <div className={`max-w-4xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
            <Badge className="mb-6 bg-blue-100 text-blue-700 border-blue-200 hover:bg-blue-200 transition-all duration-300 px-4 py-2 text-sm font-medium">
              <Sparkles className="w-4 h-4 mr-2" />
              Plataforma de Salud #1 en Colombia
            </Badge>

            <h1 className="text-5xl lg:text-7xl font-bold text-slate-900 mb-6 leading-tight">
              Tu Salud en
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> Tus Manos</span>
            </h1>

            <p className="text-xl lg:text-2xl text-slate-600 mb-8 max-w-3xl mx-auto leading-relaxed">
              Atención médica de calidad, gestión de historial clínico y farmacia online
              <span className="text-blue-600 font-semibold"> en una sola plataforma</span>
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105">
                  <Zap className="w-5 h-5 mr-2" />
                  {isAuthenticated ? "Continuar al Dashboard" : "Comenzar Ahora - Gratis"}
                </Button>
              </Link>
              <Link href="#servicios">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-slate-300 hover:border-blue-500 transition-all duration-300 group">
                  <Play className="w-5 h-5 mr-2 group-hover:scale-110 transition-transform" />
                  Ver Demo
                </Button>
              </Link>
            </div>

            {/* Estadísticas */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-2xl mx-auto">
              {[
                { icon: Users, number: "10K+", text: "Pacientes activos" },
                { icon: Award, number: "200+", text: "Médicos certificados" },
                { icon: Star, number: "4.9", text: "Rating promedio" }
              ].map((stat, index) => (
                <div key={index} className="text-center group hover:scale-105 transition-transform duration-300">
                  <div className="w-12 h-12 bg-white rounded-2xl shadow-lg flex items-center justify-center mx-auto mb-3 group-hover:shadow-xl transition-all">
                    <stat.icon className="w-6 h-6 text-blue-600" />
                  </div>
                  <div className="text-2xl font-bold text-slate-900">{stat.number}</div>
                  <div className="text-slate-600 text-sm">{stat.text}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Elementos decorativos */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-blue-200 rounded-full blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-cyan-200 rounded-full blur-xl opacity-40 animate-pulse delay-75"></div>
        <div className="absolute bottom-20 left-1/4 w-24 h-24 bg-blue-300 rounded-full blur-xl opacity-20 animate-pulse delay-150"></div>
      </section>

      {/* Servicios Mejorados */}
      <section id="servicios" className="py-20 bg-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-blue-600 border-blue-200 bg-blue-50 px-4 py-2">
              Nuestros Servicios
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Todo lo que necesitas para tu
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> bienestar</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Una plataforma completa diseñada para simplificar tu experiencia de salud
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                icon: Calendar,
                title: "Agenda de Citas",
                description: "Reserva consultas con especialistas certificados en minutos",
                color: "blue",
                features: ["Virtual y presencial", "Recordatorios automáticos", "Especialistas verificados"]
              },
              {
                icon: FileText,
                title: "Historial Médico",
                description: "Acceso seguro a tu historial clínico completo 24/7",
                color: "teal",
                features: ["Digital y seguro", "Acceso inmediato", "Compartición controlada"]
              },
              {
                icon: ShoppingBag,
                title: "Farmacia Online",
                description: "Medicamentos y productos de salud con envío a domicilio",
                color: "green",
                features: ["Entrega rápida", "Precios competitivos", "Productos verificados"]
              },
              {
                icon: Shield,
                title: "Validación Segura",
                description: "Verificación médica profesional de toda tu información",
                color: "purple",
                features: ["Encriptación AES-256", "Cumplimiento HIPAA", "Auditoría regular"]
              }
            ].map((service, index) => (
              <Card
                key={index}
                className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-white to-slate-50 hover:scale-105 cursor-pointer"
              >
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-${service.color}-100 rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <service.icon className={`w-8 h-8 text-${service.color}-600`} />
                  </div>
                  <CardTitle className="text-xl text-slate-900">{service.title}</CardTitle>
                  <CardDescription className="text-slate-600 mt-2">
                    {service.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {service.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-slate-700">
                        <CheckCircle className={`w-4 h-4 text-${service.color}-500 mr-2 flex-shrink-0`} />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Planes Mejorados */}
      <section id="planes" className="py-20 bg-gradient-to-br from-slate-50 to-blue-50">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge variant="outline" className="mb-4 text-blue-600 border-blue-200 bg-blue-50 px-4 py-2">
              Precios Transparentes
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold text-slate-900 mb-4">
              Planes que se adaptan a
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent"> tus necesidades</span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Sin sorpresas, sin contratos largos. Cancela cuando quieras.
            </p>
          </div>

          {loadingPlanes ? (
            <div className="flex justify-center items-center min-h-64">
              <div className="flex flex-col items-center gap-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-600 border-t-transparent"></div>
                <p className="text-slate-600 text-lg">Cargando planes...</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-7xl mx-auto">
              {planes.map((plan, index) => {
                const isPopular = index === 1; // El del medio es el popular
                const precio = parseFloat(plan.precio_mensual);

                return (
                  <div key={plan.id} className="relative">
                    <Card className={`
                h-full border-0 bg-white shadow-xl hover:shadow-2xl transition-all duration-500
                ${isPopular ? 'ring-2 ring-blue-500 ring-opacity-50 transform lg:scale-105' : ''}
                group hover:scale-105
              `}>
                      {isPopular && (
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-10">
                          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-6 py-2 rounded-full text-sm font-semibold flex items-center gap-2 shadow-lg">
                            <Sparkles className="w-4 h-4" />
                            Más Popular
                          </div>
                        </div>
                      )}

                      <CardHeader className="pb-6 text-center">
                        <CardTitle className="text-2xl lg:text-3xl text-slate-900">{plan.nombre}</CardTitle>
                        <div className="my-6">
                          <div className="text-4xl lg:text-5xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                            ${precio.toLocaleString('es-CO')}
                          </div>
                          <div className="text-slate-600 text-lg">por mes</div>
                        </div>
                        <CardDescription className="text-slate-600 text-base lg:text-lg">
                          {plan.descripcion}
                        </CardDescription>
                      </CardHeader>

                      <CardContent className="space-y-6">
                        <ul className="space-y-4">
                          {plan.beneficios.map((beneficio, idx) => (
                            <li key={idx} className="flex items-start group/item">
                              <div className="w-6 h-6 bg-green-100 rounded-full flex items-center justify-center mr-3 mt-0.5 group-hover/item:scale-110 transition-transform flex-shrink-0">
                                <CheckCircle className="w-4 h-4 text-green-600" />
                              </div>
                              <span className="text-slate-700 text-base lg:text-lg">{beneficio}</span>
                            </li>
                          ))}
                        </ul>

                        <Link
                          href={isAuthenticated ? "/dashboard/planes" : "/register"}
                          className="block"
                        >
                          <Button className={`
                      w-full py-4 lg:py-6 text-base lg:text-lg font-semibold transition-all duration-300
                      ${isPopular
                              ? 'bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shadow-lg hover:shadow-xl'
                              : 'bg-slate-900 hover:bg-slate-800 shadow-lg hover:shadow-xl'
                            }
                    `}>
                            {isAuthenticated ? 'Suscribirse Ahora' : 'Comenzar Gratis'}
                            <ArrowRight className="w-4 h-4 lg:w-5 lg:h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  </div>
                );
              })}
            </div>
          )}

          {/* Garantía */}
          <div className="text-center mt-12">
            <div className="inline-flex items-center space-x-2 text-slate-600 bg-white rounded-full px-6 py-3 shadow-lg">
              <Shield className="w-5 h-5 text-green-500" />
              <span className="font-medium">Garantía de satisfacción de 30 días</span>
            </div>
          </div>
        </div>
      </section>

      {/* Beneficios Mejorados */}
      <section id="beneficios" className="py-20 bg-gradient-to-br from-blue-600 via-blue-700 to-cyan-600 text-white">
        <div className="container mx-auto px-6">
          <div className="text-center mb-16">
            <Badge className="mb-4 bg-white/20 text-white border-0 px-4 py-2 backdrop-blur-sm">
              ¿Por qué elegirnos?
            </Badge>
            <h2 className="text-4xl lg:text-5xl font-bold mb-6">
              La experiencia de salud
              <span className="text-cyan-200"> más completa</span>
            </h2>
            <p className="text-xl text-blue-100 max-w-2xl mx-auto">
              Combinamos tecnología de vanguardia con atención humana excepcional
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                icon: Clock,
                title: "Ahorra Tiempo",
                description: "Gestión integral desde una sola plataforma sin complicaciones ni esperas",
                stats: "Hasta 3h menos por mes"
              },
              {
                icon: Shield,
                title: "Seguridad Garantizada",
                description: "Tus datos médicos protegidos con cifrado bancario y estándares internacionales",
                stats: "Certificación HIPAA"
              },
              {
                icon: Stethoscope,
                title: "Expertos Calificados",
                description: "Médicos certificados y especializados con años de experiencia comprobada",
                stats: "200+ profesionales"
              }
            ].map((benefit, index) => (
              <div
                key={index}
                className="bg-white/10 backdrop-blur-lg rounded-3xl p-8 hover:bg-white/15 transition-all duration-500 group hover:scale-105 border border-white/20"
              >
                <div className="w-16 h-16 bg-white/20 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <benefit.icon className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-bold mb-3">{benefit.title}</h3>
                <p className="text-blue-100 mb-4 leading-relaxed">
                  {benefit.description}
                </p>
                <div className="text-cyan-200 font-semibold text-sm">
                  {benefit.stats}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Final Mejorado */}
      <section className="py-20 bg-gradient-to-r from-slate-900 via-slate-800 to-blue-900 text-white relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-blue-500/10 to-transparent"></div>
        <div className="container mx-auto px-6 text-center relative z-10">
          <div className="max-w-4xl mx-auto">
            <Badge className="mb-6 bg-white/20 text-white border-0 px-4 py-2 backdrop-blur-sm">
              Comienza Hoy
            </Badge>

            <h2 className="text-4xl lg:text-6xl font-bold mb-6">
              Transforma tu experiencia de
              <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent"> salud</span>
            </h2>

            <p className="text-xl text-slate-300 mb-8 max-w-2xl mx-auto leading-relaxed">
              Únete a miles de colombianos que ya confían en SaludK para su bienestar y el de su familia
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
              <Link href={isAuthenticated ? "/dashboard" : "/register"}>
                <Button size="lg" className="text-lg px-8 py-6 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-600 hover:to-blue-600 shadow-2xl hover:shadow-3xl transition-all duration-300 transform hover:scale-105">
                  <Zap className="w-5 h-5 mr-2" />
                  {isAuthenticated ? "Continuar al Dashboard" : "Comenzar Gratis"}
                </Button>
              </Link>
              <Link href="#servicios">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6 border-2 border-white/30 bg-white/10 backdrop-blur-sm hover:bg-white/20 transition-all duration-300">
                  <Play className="w-5 h-5 mr-2" />
                  Ver Tour Virtual
                </Button>
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-slate-400 text-sm">
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Sin tarifas ocultas</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Cancelación gratuita</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle className="w-4 h-4 text-green-400" />
                <span>Soporte 24/7</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer Mejorado */}
      <footer className="bg-slate-900 text-white py-16">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <Link href="/" className="flex items-center space-x-3 mb-6 group">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-400 rounded-xl flex items-center justify-center">
                  <Heart className="w-6 h-6 text-white" />
                </div>
                <span className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  SaludK
                </span>
              </Link>
              <p className="text-slate-400 leading-relaxed">
                Tu salud, nuestra prioridad. Plataforma de salud digital líder en Colombia.
              </p>
            </div>

            {[
              {
                title: "Servicios",
                links: ["Consultas Médicas", "Farmacia Online", "Historial Digital", "Emergency Care"]
              },
              {
                title: "Empresa",
                links: ["Acerca de", "Contacto", "Términos", "Privacidad"]
              },
              {
                title: "Contacto",
                links: ["contacto@saludk.com", "+57 300 123 4567", "Bogotá, Colombia", "Soporte 24/7"]
              }
            ].map((column, index) => (
              <div key={index}>
                <h4 className="font-semibold text-lg mb-4 text-white">{column.title}</h4>
                <ul className="space-y-3">
                  {column.links.map((link, linkIndex) => (
                    <li key={linkIndex}>
                      <a href="#" className="text-slate-400 hover:text-white transition-colors duration-300">
                        {link}
                      </a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-slate-400 text-center md:text-left mb-4 md:mb-0">
              &copy; 2024 SaludK. Todos los derechos reservados.
            </p>
            <div className="flex space-x-6">
              {["Twitter", "Facebook", "Instagram", "LinkedIn"].map((social) => (
                <a
                  key={social}
                  href="#"
                  className="text-slate-400 hover:text-white transition-colors duration-300 hover:scale-110 transform"
                >
                  {social}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}