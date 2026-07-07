import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';
import { collegeStorage } from './college-storage';
import jwt from 'jsonwebtoken';

@Injectable()
export class CollegeMiddleware implements NestMiddleware {
  use(req: Request, _res: Response, next: NextFunction) {
    // 1. Get collegeId from x-college-id header
    let collegeId = req.headers['x-college-id'] as string;

    // 2. If not in header, try extracting from authorization token
    if (!collegeId && req.headers.authorization) {
      try {
        const token = req.headers.authorization.split(' ')[1];
        const decoded = jwt.decode(token) as any;
        if (decoded && decoded.collegeId) {
          collegeId = decoded.collegeId;
        }
      } catch (e) {
        // Ignore decode failures
      }
    }

    // Fallback to college-a if unresolved
    if (!collegeId) {
      collegeId = 'college-a';
    }

    collegeStorage.run({ collegeId }, () => {
      next();
    });
  }
}
