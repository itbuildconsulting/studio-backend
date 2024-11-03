import { Request, Response, Router } from 'express';

const router = Router();

router.get('/', (_req: Request, res: Response): Response => {
    return res.status(200).send({
        title: "Studio Backend",
        version: "1.0.0",
        node: {
            version: "20.13.1"
        }
    });
});

export default router;
