import { z } from "zod";

const objectIdRegex = /^[0-9a-fA-F]{24}$/;
const dateRegex = /^\d{4}-\d{2}-\d{2}$/;

const sellerManageableOrderStatuses = [
  "order placed",
  "shipped",
  "delivered",
  "cancelled",
  "returned",
];

const sellerFilterOrderStatuses = [
  ...sellerManageableOrderStatuses,
  "order initiated",
];

export const updateOrderStatusSchema = z.object({
  params: z.object({
    id: z.string().regex(objectIdRegex, "Invalid order id"),
  }),
  body: z.object({
    orderStatus: z.enum(sellerManageableOrderStatuses),
  }),
});

export const sellerOrderFiltersSchema = z.object({
  query: z
    .object({
      dateFrom: z
        .string()
        .regex(dateRegex, "dateFrom must be in YYYY-MM-DD format")
        .optional(),
      dateTo: z
        .string()
        .regex(dateRegex, "dateTo must be in YYYY-MM-DD format")
        .optional(),
      status: z.enum(sellerFilterOrderStatuses).or(z.literal("")).optional(),
      paymentMethod: z.enum(["COD", "Online"]).or(z.literal("")).optional(),
      q: z.string().trim().max(100, "Search query is too long").optional(),
    })
    .superRefine((query, ctx) => {
      if (query.dateFrom && query.dateTo) {
        const fromDate = new Date(`${query.dateFrom}T00:00:00.000Z`);
        const toDate = new Date(`${query.dateTo}T23:59:59.999Z`);

        if (fromDate > toDate) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            path: ["dateTo"],
            message: "dateTo must be greater than or equal to dateFrom",
          });
        }
      }
    }),
});
