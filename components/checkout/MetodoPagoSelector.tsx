'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { CreditCard, Building2, FileText, Check, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

type MetodoPago = 'TARJETA' | 'PSE' | 'CONSIGNACION';

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
    color: 'blue',
    detalles: 'Procesamiento instantáneo y seguro',
  },
  {
    id: 'PSE' as MetodoPago,
    nombre: 'PSE (Pagos Seguros en Línea)',
    descripcion: 'Débito directo desde tu banco',
    icon: Building2,
    disponible: true,
    color: 'teal',
    detalles: 'Disponible para todos los bancos en Colombia',
  },
  {
    id: 'CONSIGNACION' as MetodoPago,
    nombre: 'Consignación Bancaria',
    descripcion: 'Transferencia o depósito manual',
    icon: FileText,
    disponible: true,
    color: 'slate',
    detalles: 'Requiere verificación manual (1-2 días hábiles)',
  },
];

export default function MetodoPagoSelector({ 
  onSelect, 
  metodoPago, 
  disabled = false 
}: MetodoPagoSelectorProps) {
  const [selectedMetodo, setSelectedMetodo] = useState<MetodoPago>(metodoPago);

  const handleSelect = (metodo: MetodoPago) => {
    if (!disabled) {
      setSelectedMetodo(metodo);
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
        <RadioGroup
          value={selectedMetodo}
          onValueChange={(value) => handleSelect(value as MetodoPago)}
          className="space-y-4"
          disabled={disabled}
        >
          {metodosPago.map((metodo) => {
            const Icon = metodo.icon;
            const isSelected = selectedMetodo === metodo.id;
            
            return (
              <div key={metodo.id} className="relative">
                <RadioGroupItem
                  value={metodo.id}
                  id={metodo.id}
                  className="peer sr-only"
                  disabled={!metodo.disponible || disabled}
                />
                <Label
                  htmlFor={metodo.id}
                  className={cn(
                    "flex cursor-pointer rounded-xl border-2 p-5 transition-all duration-200",
                    "hover:border-blue-300 hover:shadow-md",
                    isSelected && "border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200",
                    !metodo.disponible && "opacity-50 cursor-not-allowed",
                    disabled && "cursor-not-allowed"
                  )}
                >
                  <div className="flex items-start gap-4 w-full">
                    {/* Icono */}
                    <div
                      className={cn(
                        "flex h-12 w-12 items-center justify-center rounded-lg transition-all",
                        isSelected
                          ? `bg-${metodo.color}-500 text-white`
                          : `bg-${metodo.color}-100 text-${metodo.color}-600`
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
                          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-blue-500">
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
                </Label>
              </div>
            );
          })}
        </RadioGroup>

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