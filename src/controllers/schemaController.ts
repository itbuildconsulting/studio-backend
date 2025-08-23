import { Request, Response } from "express";
import sequelize from "../config/database";
import { registerAllModels } from "../models/register";

export async function checkSchema(req: Request, res: Response) {
  try {
    registerAllModels(); // garante que TODOS os models estão registrados

    const qi = sequelize.getQueryInterface();
    const report: any[] = [];

    for (const [modelName, model] of Object.entries(sequelize.models)) {
      const table = String(model.getTableName());
      let dbCols: any = {};
      try {
        dbCols = await qi.describeTable(table as any);
      } catch {
        report.push({ model: modelName, table, missingInDb: Object.keys(model.getAttributes()), extraInDb: [], diffs: [] });
        continue;
      }

      const attrs = model.getAttributes() as any;
      const desired: Record<string, { attr: string; type: string; allowNull: boolean; def: any }> = {};
      for (const [attr, def] of Object.entries(attrs)) {
        const field = (def as any).field || attr;
        const type = (def as any).type?.toSql ? (def as any).type.toSql() : String((def as any).type);
        desired[field] = { attr, type, allowNull: (def as any).allowNull !== false, def: (def as any).defaultValue ?? null };
      }

      const missingInDb = Object.keys(desired).filter((c) => !dbCols[c]);
      const extraInDb   = Object.keys(dbCols).filter((c) => !desired[c]);
      const diffs: any[] = [];

      for (const col of Object.keys(desired)) {
        const want = desired[col];
        const have = dbCols[col];
        if (!have) continue;

        const dbType = String(have.type || "").toUpperCase();
        const modelType = String(want.type || "").toUpperCase();
        const dbNull = have.allowNull === true;
        const modelNull = want.allowNull === true;
        const dbDef = have.defaultValue ?? null;
        const modelDef = want.def ?? null;

        const typeDiff = modelType && dbType && !dbType.includes(modelType);
        const nullDiff = dbNull !== modelNull;
        const defDiff  = (dbDef ?? null) != (modelDef ?? null);

        if (typeDiff || nullDiff || defDiff) {
          diffs.push({ column: col, attr: want.attr, dbType, modelType, dbAllowNull: dbNull, modelAllowNull: modelNull, dbDefault: dbDef, modelDefault: modelDef });
        }
      }

      report.push({ model: modelName, table, missingInDb, extraInDb, diffs });
    }

    return res.status(200).json({
      success: true,
      database: (sequelize.config as any).database,
      host: (sequelize.config as any).host,
      models: Object.keys(sequelize.models),
      report,
    });
  } catch (e: any) {
    console.error("Schema check error:", e);
    return res.status(500).json({ success: false, message: e?.message || "Erro ao inspecionar schema" });
  }
}
