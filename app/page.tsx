import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Stethoscope, Calendar, ShoppingBag, FileText, Shield, Clock, CheckCircle } from 'lucide-react';

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-teal-50">
      <header className="border-b bg-white/80 backdrop-blur-sm sticky top-0 z-50">
        <div className="container mx-auto px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
              <Stethoscope className="w-6 h-6 text-white" />
            </div>
            <span className="text-2xl font-bold text-slate-800">SaludK</span>
          </Link>
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="#servicios" className="text-slate-600 hover:text-blue-600 transition">
              Servicios
            </Link>
            <Link href="#planes" className="text-slate-600 hover:text-blue-600 transition">
              Planes
            </Link>
            <Link href="#beneficios" className="text-slate-600 hover:text-blue-600 transition">
              Beneficios
            </Link>
            <Link href="/login">
              <Button variant="outline">Iniciar Sesión</Button>
            </Link>
            <Link href="/register">
              <Button>Registrarse</Button>
            </Link>
          </nav>
          <div className="md:hidden flex items-center space-x-2">
            <Link href="/login">
              <Button variant="outline" size="sm">Ingresar</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="container mx-auto px-6 py-20 text-center">
        <h1 className="text-5xl md:text-6xl font-bold text-slate-800 mb-6">
          Tu Salud en Tus Manos
        </h1>
        <p className="text-xl text-slate-600 mb-8 max-w-2xl mx-auto">
          Accede a atención médica de calidad, agenda citas, gestiona tu historial clínico
          y compra productos de salud desde un solo lugar.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link href="/register">
            <Button size="lg" className="text-lg px-8">Comenzar Ahora</Button>
          </Link>
          <Link href="#servicios">
            <Button size="lg" variant="outline" className="text-lg px-8">Ver Servicios</Button>
          </Link>
        </div>
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6 max-w-4xl mx-auto">
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5 text-teal-500" />
            <span className="text-slate-700">100% Seguro</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5 text-teal-500" />
            <span className="text-slate-700">Atención 24/7</span>
          </div>
          <div className="flex items-center justify-center space-x-2">
            <CheckCircle className="w-5 h-5 text-teal-500" />
            <span className="text-slate-700">Médicos Certificados</span>
          </div>
        </div>
      </section>

      <section id="servicios" className="bg-white py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-4">
            Nuestros Servicios
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Plataforma integral para el cuidado de tu salud
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <Calendar className="w-6 h-6 text-blue-600" />
                </div>
                <CardTitle>Agenda de Citas</CardTitle>
                <CardDescription>
                  Reserva consultas médicas con especialistas certificados
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-teal-100 rounded-lg flex items-center justify-center mb-4">
                  <FileText className="w-6 h-6 text-teal-600" />
                </div>
                <CardTitle>Historial Médico</CardTitle>
                <CardDescription>
                  Accede a tu historial clínico digital en cualquier momento
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                  <ShoppingBag className="w-6 h-6 text-green-600" />
                </div>
                <CardTitle>Farmacia Online</CardTitle>
                <CardDescription>
                  Compra medicamentos y productos de salud con envío a domicilio
                </CardDescription>
              </CardHeader>
            </Card>
            <Card className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <Shield className="w-6 h-6 text-purple-600" />
                </div>
                <CardTitle>Validación Segura</CardTitle>
                <CardDescription>
                  Verificación médica profesional de toda la información
                </CardDescription>
              </CardHeader>
            </Card>
          </div>
        </div>
      </section>

      <section id="planes" className="py-20">
        <div className="container mx-auto px-6">
          <h2 className="text-4xl font-bold text-center text-slate-800 mb-4">
            Planes de Suscripción
          </h2>
          <p className="text-center text-slate-600 mb-12 max-w-2xl mx-auto">
            Elige el plan que mejor se adapte a tus necesidades
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
            <Card className="border-2">
              <CardHeader>
                <CardTitle className="text-2xl">Plan Básico</CardTitle>
                <div className="text-4xl font-bold text-blue-600 my-4">
                  $29.99<span className="text-lg text-slate-600">/mes</span>
                </div>
                <CardDescription>Ideal para cuidado médico esencial</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-teal-500 mr-2" />
                    2 consultas médicas al mes
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-teal-500 mr-2" />
                    Historial médico digital
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-teal-500 mr-2" />
                    Descuentos en farmacia
                  </li>
                </ul>
              </CardContent>
            </Card>
            <Card className="border-2 border-blue-500 shadow-lg">
              <div className="bg-blue-500 text-white text-center py-2 rounded-t-lg font-semibold">
                Más Popular
              </div>
              <CardHeader>
                <CardTitle className="text-2xl">Plan Completo</CardTitle>
                <div className="text-4xl font-bold text-blue-600 my-4">
                  $49.99<span className="text-lg text-slate-600">/mes</span>
                </div>
                <CardDescription>Cobertura completa de salud</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-3">
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-teal-500 mr-2" />
                    Consultas ilimitadas
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-teal-500 mr-2" />
                    Especialistas certificados
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-teal-500 mr-2" />
                    Historial médico completo
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-teal-500 mr-2" />
                    Descuentos especiales en farmacia
                  </li>
                  <li className="flex items-center">
                    <CheckCircle className="w-5 h-5 text-teal-500 mr-2" />
                    Atención prioritaria 24/7
                  </li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      <section id="beneficios" className="bg-blue-600 text-white py-20">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-12">¿Por qué elegir SaludK?</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            <div>
              <Clock className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Ahorra Tiempo</h3>
              <p className="text-blue-100">
                Gestiona todo desde una sola plataforma sin complicaciones
              </p>
            </div>
            <div>
              <Shield className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Seguridad Garantizada</h3>
              <p className="text-blue-100">
                Tus datos médicos protegidos con los más altos estándares
              </p>
            </div>
            <div>
              <Stethoscope className="w-12 h-12 mx-auto mb-4" />
              <h3 className="text-xl font-bold mb-2">Profesionales Calificados</h3>
              <p className="text-blue-100">
                Médicos certificados y especializados en diversas áreas
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="py-20 bg-gradient-to-r from-blue-500 to-teal-400 text-white">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-4xl font-bold mb-6">Comienza Tu Viaje Hacia Una Mejor Salud</h2>
          <p className="text-xl mb-8 opacity-90">
            Únete a miles de usuarios que ya confían en SaludK
          </p>
          <Link href="/register">
            <Button size="lg" variant="secondary" className="text-lg px-8">
              Registrarse Gratis
            </Button>
          </Link>
        </div>
      </section>

      <footer className="bg-slate-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-teal-400 rounded-lg flex items-center justify-center">
                  <Stethoscope className="w-5 h-5 text-white" />
                </div>
                <span className="text-xl font-bold">SaludK</span>
              </div>
              <p className="text-slate-400">
                Tu salud, nuestra prioridad.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Servicios</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Consultas Médicas</li>
                <li>Farmacia Online</li>
                <li>Historial Digital</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Empresa</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Acerca de</li>
                <li>Contacto</li>
                <li>Términos y Condiciones</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Contacto</h4>
              <ul className="space-y-2 text-slate-400">
                <li>Email: contacto@saludk.com</li>
                <li>Teléfono: +57 300 123 4567</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-700 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 SaludK. Todos los derechos reservados.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
