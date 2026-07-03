import { ExceptionFilter, Catch, ArgumentsHost, HttpException, HttpStatus } from '@nestjs/common';

@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();
    
    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Internal server error';
    let errors: any[] = [];
    
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res: any = exception.getResponse();
      
      if (typeof res === 'object') {
        message = res.message || exception.message;
        errors = res.errors || [];
        
        // Handle validation errors format from Class Validator (which returns an array of messages)
        if (Array.isArray(res.message)) {
          errors = res.message;
          message = 'Validation failed';
        }
      } else {
        message = res;
      }
    } else if (exception instanceof Error) {
      message = exception.message;
    }
    
    response.status(status).json({
      success: false,
      message,
      errors: Array.isArray(errors) ? errors : [errors],
    });
  }
}
