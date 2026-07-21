import { Router, type IRouter } from "express";
import healthRouter from "./health";
import vocabRouter from "./vocab";
import kanjiRouter from "./kanji";
import practiceRouter from "./practice";
import statsRouter from "./stats";

const router: IRouter = Router();

router.use(healthRouter);
router.use("/vocab", vocabRouter);
router.use("/kanji", kanjiRouter);
router.use("/practice", practiceRouter);
router.use("/stats", statsRouter);

export default router;
