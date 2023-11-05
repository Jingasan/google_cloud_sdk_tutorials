import { Request, Response } from "@google-cloud/functions-framework";

/**
 * HTTP関数
 *
 * @param {Object} _req Cloud Function request context.
 * @param {Object} res Cloud Function response context.
 */
export const func = (_req: Request, res: Response) => {
  res.status(200).json("OK");
};
