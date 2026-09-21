import { Request, Response } from 'express';

export abstract class BaseController {
  protected sendSuccess(res: Response, data: any, statusCode: number = 200) {
    return res.status(statusCode).json({
      success: true,
      data,
    });
  }

  protected sendError(res: Response, message: string, statusCode: number = 500) {
    return res.status(statusCode).json({
      success: false,
      error: message,
    });
  }

  protected async handleRequest(
    req: Request,
    res: Response,
    handler: () => Promise<any>
  ) {
    try {
      const result = await handler();
      return this.sendSuccess(res, result);
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Internal server error';
      return this.sendError(res, message);
    }
  }
}
