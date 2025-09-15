import { HTTP_STATUS } from "./HttpStatus";

export class HttpResponse {
    static success<T>(data: T, message?: string) {
        return Response.json({
            success: true,
            data,
            message: message || 'Success',
        }, { status: HTTP_STATUS.OK });
    }

    static created<T>(data: T, message?: string) {
        return Response.json({
            success: true,
            data,
            message: message || "Success",
        }, { status: HTTP_STATUS.CREATED });
    }

    static badRequest(message?: string, details?: any) {
        return Response.json({
            success: false,
            error: "Bad Request",
            message: message || "Invalid request parameters",
            details
        }, { status: HTTP_STATUS.BAD_REQUEST });
    }

    static unAuthorized(message?: string) {
        return Response.json({
            success: false,
            error: "UnAuthorized",
            message: message || "Authentication required",
        }, { status: HTTP_STATUS.UNAUTHORIZED });
    }

    static forbidden(message?: string) {
        return Response.json({
            success: false,
            error: "Forbidden",
            message: message || "Access denied",
        }, { status: HTTP_STATUS.FORBIDDEN });
    }

    static notFound(resource?: string) {
        return Response.json({
            success: false,
            error: "Not Found",
            message: resource ? `${resource} not found` : "Resource not found",
        }, { status: HTTP_STATUS.NOT_FOUND });
    }

    static methodNotAllowed() {
        return Response.json({
            success: false,
            error: "Method not Allowed",
            message: "지원하지 않는 메소드입니다.",
        }, { status : 405 });
    }

    static internalError(message?: string, details?: any) {
        return Response.json({
            success: false,
            error: "Internal Server Error",
            message: message || 'An unexpected error occurred',
            details: process.env.NODE_ENV === 'development' ? details : undefined,
        }, { status: HTTP_STATUS.INTERNAL_ERROR });
    }

    static notImplemented(message?: string) {
        return Response.json({
            success: false,
            error: 'Not Implemented',
            message: message || 'Feature not implemented',
        }, { status: HTTP_STATUS.NOT_IMPLEMENTED });
    }

}