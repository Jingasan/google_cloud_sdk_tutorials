import * as functions from "@google-cloud/functions-framework";
import express, { Request, Response } from "express";
import cors from "cors";
const app = express();
// リクエストボディのパース用設定
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
// CORSの設定
app.use(cors());
// GET
app.get("/", (req: Request, res: Response) => {
  return res.status(200).json({ Query: req.query });
});
// POST
app.post("/", (req: Request, res: Response) => {
  return res.status(200).json({ PostBody: req.body });
});
// PUT
app.put("/", async (req: Request, res: Response) => {
  return res.status(200).json({ RequestHeader: req.headers });
});
// DELETE
app.delete("/:id", async (req: Request, res: Response) => {
  return res.status(200).json({ URLParams: req.params.id });
});
// Error 404 Not Found
app.use((_req: Request, res: Response) => {
  return res.status(404).json({ error: "Not Found" });
});
// 関数のエンドポイント
functions.http("func", app);
