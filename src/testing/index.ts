import {createTestLibrary, findTestPackageRoot, type TypeSpecTestLibrary} from "@typespec/compiler/testing";

export const EbusTestLibrary: TypeSpecTestLibrary = createTestLibrary({
  name: "ebus",
  packageRoot: await findTestPackageRoot(import.meta.url),
});
