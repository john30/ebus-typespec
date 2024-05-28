import { resolvePath } from "@typespec/compiler";
import { createTestLibrary, TypeSpecTestLibrary } from "@typespec/compiler/testing";
import { fileURLToPath } from "url";

export const EbusTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "ebus",
  packageRoot: resolvePath(fileURLToPath(import.meta.url), "../../../../"),
});
