import { Router } from "express";
import { checkSchema, syncClassSchema, syncCrmSchema } from "../controllers/schemaController";
import { authenticateToken } from "../core/token/authenticateToken";
// opcional: middleware de autenticação/admin
// import { requireAdmin } from "../middlewares/auth";

const router = Router();

// GET /admin/schema/check
router.get("/schema/check", /* requireAdmin, */ checkSchema);

// POST /admin/schema/sync/class
router.post("/schema/sync/class", /* requireAdmin, */ syncClassSchema);

// POST /admin/schema/sync/crm
router.post("/schema/sync/crm", authenticateToken, syncCrmSchema);

export default router;
