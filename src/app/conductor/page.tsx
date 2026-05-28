import { ModulePlaceholder } from "@/components/module-placeholder";

export default function ConductorPage() {
  return (
    <ModulePlaceholder
      eyebrow="Web Responsive Conductor"
      title="Flujos del conductor"
      description="Este modulo alojara pago digital via QR, ticket activo, historial, consulta de deuda y emergencias."
      nextSteps={[
        "Sprint 1: consumir reglas de dominio y mock backend.",
        "Sprint 3: implementar pago QR, extension de tiempo y deuda por dominio."
      ]}
    />
  );
}
