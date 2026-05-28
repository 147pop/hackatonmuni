import { ModulePlaceholder } from "@/components/module-placeholder";

export default function PermisionarioPage() {
  return (
    <ModulePlaceholder
      eyebrow="Web Responsive Permisionario"
      title="Operacion diaria del permisionario"
      description="Este modulo alojara QR fijo, credencial digital, registro en efectivo, incumplimientos y actividad diaria."
      nextSteps={[
        "Sprint 1: usar entidades de permisionario, cuadra, pago y deuda.",
        "Sprint 2: implementar QR, credencial y registros operativos."
      ]}
    />
  );
}
