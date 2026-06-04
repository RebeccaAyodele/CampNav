export const ErrorCodes = {
  BadRequest: "BAD_REQUEST",
  ValidationError: "VALIDATION_ERROR",
  Unauthorized: "UNAUTHORIZED",
  Forbidden: "FORBIDDEN",
  NotFound: "NOT_FOUND",
  Conflict: "CONFLICT",
  DatabaseError: "DATABASE_ERROR",
  InternalServerError: "INTERNAL_SERVER_ERROR",

  InvalidCredentials: "INVALID_CREDENTIALS",
  MissingBearerToken: "MISSING_BEARER_TOKEN",
  InvalidBearerToken: "INVALID_BEARER_TOKEN",

  PoiNotFound: "POI_NOT_FOUND",
  RouteNotFound: "ROUTE_NOT_FOUND",
  InvalidRouteRequest: "INVALID_ROUTE_REQUEST",

  ShuttleNotFound: "SHUTTLE_NOT_FOUND",
  LostPersonReportNotFound: "LOST_PERSON_REPORT_NOT_FOUND",
  InvalidStatusTransition: "INVALID_STATUS_TRANSITION",

  UssdSessionError: "USSD_SESSION_ERROR"
} as const;

export type ErrorCode = (typeof ErrorCodes)[keyof typeof ErrorCodes];
