import { z } from 'zod';
import { insertQuestionnaireResponseSchema } from './schema';

export const errorSchemas = {
  validation: z.object({
    message: z.string(),
    field: z.string().optional(),
  }),
  notFound: z.object({
    message: z.string(),
  }),
  unauthorized: z.object({
    message: z.string(),
  }),
  internal: z.object({
    message: z.string(),
  }),
};

export const api = {
  whitelist: {
    check: {
      method: 'GET' as const,
      path: '/api/whitelist/check' as const,
      responses: {
        200: z.object({ isWhitelisted: z.boolean() }),
        401: errorSchemas.unauthorized,
      },
    },
  },
  questionnaire: {
    get: {
      method: 'GET' as const,
      path: '/api/questionnaire' as const,
      responses: {
        200: z.object({
          hasCompleted: z.boolean(),
          latest: z
            .object({
              displayName: z.string(),
              drivingLevel: z.string(),
              goal: z.string(),
              drivingStyle: z.string(),
              createdAt: z.string(),
            })
            .nullable()
            .optional(),
        }),
        401: errorSchemas.unauthorized,
      },
    },
    submit: {
      method: 'POST' as const,
      path: '/api/questionnaire' as const,
      input: insertQuestionnaireResponseSchema,
      responses: {
        200: z.object({ success: z.boolean() }),
        400: errorSchemas.validation,
        401: errorSchemas.unauthorized,
      },
    },
  },
};

export function buildUrl(path: string, params?: Record<string, string | number>): string {
  let url = path;
  if (params) {
    Object.entries(params).forEach(([key, value]) => {
      if (url.includes(`:${key}`)) {
        url = url.replace(`:${key}`, String(value));
      }
    });
  }
  return url;
}
