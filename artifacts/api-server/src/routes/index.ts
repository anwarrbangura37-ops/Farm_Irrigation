import { Router, type IRouter } from "express";
import farmRouter from "./farm";
import healthRouter from "./health";

const router: IRouter = Router();

router.use(healthRouter);
router.use(farmRouter);

export default router;
