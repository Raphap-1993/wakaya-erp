import { describe, expect, it } from "vitest";

import * as loginPageModule from "@/app/login/page";

import * as adminDashboardPageModule from "./page";
import * as reservationDetailPageModule from "./reservations/[id]/page";
import * as reservationEditPageModule from "./reservations/[id]/edit/page";
import * as reservationFlowsPageModule from "./reservations/flows/page";
import * as reservationNewPageModule from "./reservations/new/page";
import * as occupancyPageModule from "./reservations/occupancy/page";
import * as reservationsPageModule from "./reservations/page";
import * as requestDetailPageModule from "./reservations/requests/[id]/page";
import * as requestsPageModule from "./reservations/requests/page";
import * as userDetailPageModule from "./users/[id]/page";
import * as userNewPageModule from "./users/new/page";

const modules = [
  ["login", loginPageModule],
  ["admin dashboard", adminDashboardPageModule],
  ["reservations monitor", reservationsPageModule],
  ["reservation detail", reservationDetailPageModule],
  ["reservation edit", reservationEditPageModule],
  ["reservation new", reservationNewPageModule],
  ["booking requests monitor", requestsPageModule],
  ["booking request detail", requestDetailPageModule],
  ["occupancy", occupancyPageModule],
  ["flows", reservationFlowsPageModule],
  ["user detail", userDetailPageModule],
  ["user new", userNewPageModule],
] as const;

describe("backoffice runtime configuration", () => {
  it.each(modules)("forces dynamic rendering for %s", (_label, module) => {
    expect(module.dynamic).toBe("force-dynamic");
  });
});
