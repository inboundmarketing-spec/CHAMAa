import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import * as express from 'express';

@Injectable()
export class RawBodyMiddleware implements NestMiddleware {
  use(req: Request, res: Response, next: NextFunction) {
    if (req.path?.includes('/webhook/whatsapp')) {
      express.raw({ type: 'application/json' })(req, res, () => {
        if (Buffer.isBuffer(req.body)) {
          (req as Request & { rawBody: Buffer }).rawBody = req.body;
          try {
            req.body = JSON.parse(req.body.toString('utf8'));
          } catch {
            req.body = {};
          }
        }
        next();
      });
    } else {
      next();
    }
  }
}
