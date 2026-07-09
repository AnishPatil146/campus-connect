import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];
    let errorCode = 'INTERNAL_SERVER_ERROR';
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      
      if (typeof res === 'object') {
        message = res.message || exception.message;
        errors = res.errors || [];
        
        if (res.errorCode) {
          errorCode = res.errorCode;
        } else if (status === HttpStatus.BAD_REQUEST) {
          errorCode = 'VALIDATION_ERROR';
        } else if (status === HttpStatus.UNAUTHORIZED) {
          errorCode = 'AUTH_ERROR';
        } else if (status === HttpStatus.FORBIDDEN) {
          errorCode = 'FORBIDDEN_ERROR';
        } else if (status === HttpStatus.NOT_FOUND) {
          errorCode = 'NOT_FOUND_ERROR';
        } else if (status === HttpStatus.CONFLICT) {
          errorCode = 'CONFLICT_ERROR';
        }
        
        // Handle validation errors format from Class Validator (which returns an array of messages)
        if (Array.isArray(res.message)) {
          errors = res.message;
          message = 'Validation failed';
          errorCode = 'VALIDATION_ERROR';
        }
      } else {
        message = res;
        if (status === HttpStatus.UNAUTHORIZED) {
          errorCode = 'AUTH_ERROR';
        }
      }
    } else if (exception instanceof Error) {
      message = exception.message;
      if (exception.constructor.name.includes('Prisma') || exception.message.includes('database')) {
        errorCode = 'DATABASE_ERROR';
      }
    }
    
    response.status(status).json({
      success: false,
      message,
      errorCode,
      errors: Array.isArray(errors) ? errors : [errors],
    });
  }
}
