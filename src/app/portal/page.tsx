import { ModulePlaceholder } from "@/components/module-placeholder";

export default function PortalPage() {
  return (
    <ModulePlaceholder
      eyebrow="Portal Web Publico"
      title="Pago sin cuenta SEM"
      description="Este modulo permitira pagar estacionamiento y consultar deudas por dominio sin crear una cuenta SEM."
      nextSteps={[
        "Sprint 1: compartir validaciones, tarifas y persistencia.",
        "Sprint 3: implementar pago sin cuenta y consulta publica de deudas."
      ]}
    />
  );
}
