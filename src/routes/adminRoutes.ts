import { Router } from "express";
import { checkSchema } from "../controllers/schemaController";
// opcional: middleware de autenticação/admin
// import { requireAdmin } from "../middlewares/auth";

const router = Router();

// GET /admin/schema/check
router.get("/schema/check", /* requireAdmin, */ checkSchema);

export default router;
