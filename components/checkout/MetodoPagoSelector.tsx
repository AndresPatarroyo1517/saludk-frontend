'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { CreditCard, Building2, FileText, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type MetodoPago = 'TARJETA' | 'PASARELA' | 'CONSIGNACION';

interface MetodoPagoSelectorProps {
  onSelect: (metodo: MetodoPago) => void;
  metodoPago: MetodoPago;
  disabled?: boolean;
}

const metodosPago = [
  {
    id: 'TARJETA' as MetodoPago,
    nombre: 'Tarjeta de Crédito/Débito',
    descripcion: 'Pago inmediato con Stripe',
    icon: CreditCard,
    disponible: true,
    bgColor: 'bg-blue-100',
    textColor: 'text-blue-600',
    borderColor: 'border-blue-500',
    hoverBorder: 'hover:border-blue-300',
    selectedBg: 'bg-blue-50',
    selectedRing: 'ring-blue-200',
    iconBg: 'bg-blue-500',
    detalles: 'Procesamiento instantáneo y seguro',
  },
  {
    id: 'PASARELA' as MetodoPago,
    nombre: 'PSE (Pagos Seguros en Línea)',
    descripcion: 'Débito directo desde tu banco',
    icon: Building2,
    disponible: true,
    bgColor: 'bg-teal-100',
    textColor: 'text-teal-600',
    borderColor: 'border-teal-500',
    hoverBorder: 'hover:border-teal-300',
    selectedBg: 'bg-teal-50',
    selectedRing: 'ring-teal-200',
    iconBg: 'bg-teal-500',
    detalles: 'Disponible para todos los bancos en Colombia',
  },
  {
    id: 'CONSIGNACION' as MetodoPago,
    nombre: 'Consignación Bancaria',
    descripcion: 'Transferencia o depósito manual',
    icon: FileText,
    disponible: true,
    bgColor: 'bg-slate-100',
    textColor: 'text-slate-600',
    borderColor: 'border-slate-500',
    hoverBorder: 'hover:border-slate-300',
    selectedBg: 'bg-slate-50',
    selectedRing: 'ring-slate-200',
    iconBg: 'bg-slate-500',
    detalles: 'Requiere verificación manual (1-2 días hábiles)',
  },
];

export default function MetodoPagoSelector({ 
  onSelect, 
  metodoPago, 
  disabled = false  
}: MetodoPagoSelectorProps) {
  const handleSelect = (metodo: MetodoPago) => {
    if (!disabled) {
      onSelect(metodo);
    }
  };

  return (
    <Card className="border-blue-100 shadow-lg">
      <CardHeader>
        <CardTitle className="text-2xl">Método de Pago</CardTitle>
        <CardDescription className="text-base">
          Selecciona cómo deseas realizar tu pago
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {metodosPago.map((metodo) => {
            const Icon = metodo.icon;
            const isSelected = metodoPago === metodo.id;
            
            return (
              <div
                key={metodo.id}
                onClick={() => handleSelect(metodo.id)}
                className={cn(
                  "flex cursor-pointer rounded-xl border-2 p-5 transition-all duration-200",
                  metodo.hoverBorder,
                  "hover:shadow-md",
                  isSelected && `${metodo.borderColor} ${metodo.selectedBg} shadow-lg ring-2 ${metodo.selectedRing}`,
                  !isSelected && "border-slate-200",
                  !metodo.disponible && "opacity-50 cursor-not-allowed",
                  disabled && "cursor-not-allowed"
                )}
              >
                <div className="flex items-start gap-4 w-full">
                  {/* Icono */}
                  <div
                    className={cn(
                      "flex h-12 w-12 items-center justify-center rounded-lg transition-all",
                      isSelected ? `${metodo.iconBg} text-white` : `${metodo.bgColor} ${metodo.textColor}`
                    )}
                  >
                    <Icon className="h-6 w-6" />
                  </div>

                  {/* Contenido */}
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <p className="font-semibold text-slate-800 text-lg">
                        {metodo.nombre}
                      </p>
                      {isSelected && (
                        <div className={cn("flex h-6 w-6 items-center justify-center rounded-full", metodo.iconBg)}>
                          <Check className="h-4 w-4 text-white" />
                        </div>
                      )}
                    </div>
                    <p className="text-sm text-slate-600">{metodo.descripcion}</p>
                    
                    {/* Detalles adicionales */}
                    <div className="flex items-start gap-2 mt-2 text-xs text-slate-500">
                      <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>{metodo.detalles}</span>
                    </div>

                    {!metodo.disponible && (
                      <p className="text-xs text-red-600 font-medium mt-2">
                        Temporalmente no disponible
                      </p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Información de seguridad */}
        <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-teal-50 rounded-lg border border-green-200">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-green-500">
              <Check className="h-5 w-5 text-white" />
            </div>
            <div className="flex-1">
              <h4 className="font-semibold text-green-900 mb-1">
                Pagos 100% Seguros
              </h4>
              <p className="text-sm text-green-800">
                Todos los pagos están encriptados y protegidos. Tus datos financieros
                nunca se almacenan en nuestros servidores.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}