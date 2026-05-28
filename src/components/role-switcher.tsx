"use client";

import { useEffect, useState } from "react";
import { appRoutes } from "@/lib/routes";

const storageKey = "sem-demo-role";

export function RoleSwitcher() {
  const [selectedRole, setSelectedRole] = useState(appRoutes[0].label);

  useEffect(() => {
    const stored = window.localStorage.getItem(storageKey);
    if (stored) {
      setSelectedRole(stored);
    }
  }, []);

  function selectRole(role: string) {
    setSelectedRole(role);
    window.localStorage.setItem(storageKey, role);
  }

  return (
    <section
      aria-label="Selector de rol demo"
      className="rounded-lg border border-municipal-line bg-white p-4 shadow-panel"
    >
      <h2 className="text-sm font-semibold text-municipal-ink">Rol activo</h2>
      <p className="mt-1 text-sm text-municipal-muted">{selectedRole}</p>
      <div className="mt-4 grid grid-cols-2 gap-2">
        {appRoutes.map((route) => (
          <button
            key={route.href}
            type="button"
            onClick={() => selectRole(route.label)}
            className={`min-h-11 rounded-md border px-3 text-sm font-medium ${
              selectedRole === route.label
                ? "border-municipal-action bg-municipal-action text-white"
                : "border-municipal-line bg-white text-municipal-ink hover:border-municipal-action"
            }`}
          >
            {route.label.replace(" Municipal", "")}
          </button>
        ))}
      </div>
    </section>
  );
}
