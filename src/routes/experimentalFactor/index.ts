import { ExperimentalFactorSchema } from "./type";
import { createRoutes } from "../../factory";

const ExperimentalFactorRoutes = createRoutes(
  ExperimentalFactorSchema,
  "experimentalFactor",
  ["description", "factorDescription"],
);

export { ExperimentalFactorRoutes };
