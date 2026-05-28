import { ModulePlaceholder } from "@/components/module-placeholder";

export default function AdminPage() {
  return (
    <ModulePlaceholder
      eyebrow="Panel Administrativo Municipal"
      title="Gestion y monitoreo municipal"
      description="Este modulo mostrara dashboard, reportes, auditoria, configuracion normativa, alertas y liquidaciones."
      nextSteps={[
        "Sprint 1: derivar metricas desde el store compartido.",
        "Sprint 4 y 5: implementar configuracion, reportes y monitoreo."
      ]}
    />
  );
}
