import { BiologicalMaterialSchema } from "./type";
import { createRoutes } from "../../factory";

const BiologicalMaterialRoutes = createRoutes(
  BiologicalMaterialSchema,
  "biologicalMaterial",
  ["title"],
);

export { BiologicalMaterialRoutes };
