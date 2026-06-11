import { Router } from "express";
import { checkSchema, syncClassSchema } from "../controllers/schemaController";
// opcional: middleware de autenticação/admin
// import { requireAdmin } from "../middlewares/auth";

const router = Router();

// GET /admin/schema/check
router.get("/schema/check", /* requireAdmin, */ checkSchema);

// POST /admin/schema/sync/class
router.post("/schema/sync/class", /* requireAdmin, */ syncClassSchema);

export default router;
