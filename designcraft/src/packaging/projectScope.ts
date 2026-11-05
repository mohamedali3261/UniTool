import type { ProjectItem } from "../types";
import { boxFamily, type PackagingFamily } from "./catalog";
export const isPackagingProject = (p: ProjectItem) =>
  !!p.packaging || p.category === "packaging";
/** Views only: never pass a scoped list into global storage deletion/backup operations. */
export const packagingProjects = (
  projects: ProjectItem[],
  family: PackagingFamily,
) =>
  projects.filter(
    (p) =>
      isPackagingProject(p) &&
      (family === "all" || boxFamily(p.packaging?.size) === family),
  );
