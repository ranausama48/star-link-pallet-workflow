export const apiRouteSegment = {
  runtime: 'nodejs' as const,
  dynamic: 'force-dynamic' as const,
  maxDuration: 60,
};

export type ServiceResponse = {
  status: number;
  body: unknown;
};
