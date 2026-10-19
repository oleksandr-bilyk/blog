import { z } from "zod";

export const customers = ["Cedar Crafts", "Maple Studio", "Willow Works"] as const;
export const requestStatusSchema = z.enum(["Pending", "Completed", "Rejected"]);
export const requestSchema = z.object({
    id: z.string(),
    title: z.string(),
    kind: z.enum(["Order", "Delivery"]),
    customer: z.enum(customers),
    owner: z.string(),
    description: z.string(),
    status: requestStatusSchema,
    createdAt: z.iso.datetime(),
    updatedAt: z.iso.datetime()
});
export const requestsSchema = z.array(requestSchema);
export const resolveRequestsSchema = z.object({
    ids: z.array(z.string().min(1)).min(1).max(100).refine(ids => new Set(ids).size === ids.length),
    outcome: z.enum(["Completed", "Rejected"])
}).strict();
export type WorkshopRequest = z.infer<typeof requestSchema>;
export type RequestStatus = z.infer<typeof requestStatusSchema>;
export type Resolution = z.infer<typeof resolveRequestsSchema>;
export const customerSettingsSchema = z.object({
    deliveryMethod: z.enum(["Collection", "Delivery"]),
    notificationsEnabled: z.boolean()
}).strict();
export const customerSchema = z.object({
    id: z.string(),
    name: z.enum(customers),
    description: z.string(),
    ...customerSettingsSchema.shape
});
export const customersSchema = z.array(customerSchema);
export type Customer = z.infer<typeof customerSchema>;
export type CustomerSettings = z.infer<typeof customerSettingsSchema>;
