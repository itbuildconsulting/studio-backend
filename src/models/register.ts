import fs from "fs";
import path from "path";

/** Registra todos os models (*.model.ts|js) da pasta src/models */
export function registerAllModels() {
  const modelsDir = __dirname; // -> src/models (em dev) | dist/models (em build)
  const files = fs.readdirSync(modelsDir);

  for (const file of files) {
    const full = path.join(modelsDir, file);

    // ignora .d.ts e não-models
    const isModel =
      (file.endsWith(".model.ts") || file.endsWith(".model.js")) &&
      !file.endsWith(".d.ts");

    if (isModel) {
      // CommonJS require funciona em ts-node e no build
      // eslint-disable-next-line @typescript-eslint/no-var-requires
      require(full);
    }
  }
}
