import { NextFunction, Request, Response, RequestHandler } from 'express';
import { ZodTypeAny } from 'zod';

export const validate = (
  schema: ZodTypeAny,
  source: 'body' | 'query' | 'params' = 'body'
): RequestHandler => {
  return (req: Request, _res: Response, next: NextFunction) => {
    const parsed = schema.parse(req[source]);
    if (source === 'body') req.body = parsed;
    else if (source === 'query') (req as Request & { query: unknown }).query = parsed as Request['query'];
    else (req as Request & { params: unknown }).params = parsed as Request['params'];
    next();
  };
};
