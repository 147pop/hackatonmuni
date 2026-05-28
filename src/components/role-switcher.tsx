"use client";

import { useSyncExternalStore } from "react";
import { appRoutes } from "@/lib/routes";

const storageKey = "sem-demo-role";
const roleChangeEvent = "sem-demo-role-change";
const defaultRole = appRoutes[0].label;

function getStoredRole() {
  if (typeof window === "undefined") {
    return defaultRole;
  }

  return window.localStorage.getItem(storageKey) ?? defaultRole;
}

function subscribeToRoleChanges(callback: () => void) {
  window.addEventListener("storage", callback);
  window.addEventListener(roleChangeEvent, callback);

  return () => {
    window.removeEventListener("storage", callback);
    window.removeEventListener(roleChangeEvent, callback);
  };
}

export function RoleSwitcher() {
  const selectedRole = useSyncExternalStore(
    subscribeToRoleChanges,
    getStoredRole,
    () => defaultRole
  );

  function selectRole(role: string) {
    window.localStorage.setItem(storageKey, role);
    window.dispatchEvent(new Event(roleChangeEvent));
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
