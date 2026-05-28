import { describe, expect, it } from "vitest";
import { appRoutes, routeLabels } from "./routes";

describe("appRoutes", () => {
  it("defines the four MVP operating areas", () => {
    expect(appRoutes.map((route) => route.href)).toEqual([
      "/conductor",
      "/portal",
      "/permisionario",
      "/admin"
    ]);
  });

  it("provides labels for shell navigation", () => {
    expect(routeLabels["/conductor"]).toBe("Conductor");
    expect(routeLabels["/portal"]).toBe("Portal Publico");
    expect(routeLabels["/permisionario"]).toBe("Permisionario");
    expect(routeLabels["/admin"]).toBe("Admin Municipal");
  });
});
