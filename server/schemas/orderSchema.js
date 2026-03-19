import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const ORDER_STATUSES = [
  "pending",
  "processing",
  "delivered",
  "cancelled",
];

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid order id"),
  }),
  body: z.object({
    status: z.enum(ORDER_STATUSES).optional(),
    orderStatus: z.enum(ORDER_STATUSES).optional(),
  }).refine(data => data.status || data.orderStatus, {
    message: "Status property is required",
  }),
});

export const sellerOrderFiltersSchema = z.object({
  query: z
    .object({
      dateFrom: z.string().regex(dateRegex, "YYYY-MM-DD required").optional(),
      dateTo: z.string().regex(dateRegex, "YYYY-MM-DD required").optional(),
      status: z.enum([...ORDER_STATUSES, ""]).optional(),
      paymentMethod: z.enum(["cod", "stripe", ""]).optional(),
      q: z.string().trim().max(100, "Search query is too long").optional(),
    })
    .superRefine((query, ctx) => {
      if (query.dateFrom && query.dateTo) {
        if (new Date(query.dateFrom) > new Date(query.dateTo)) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["dateTo"],
            message: "End date must be after start date",
          });
        }
      }
    }),
});
