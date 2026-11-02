import { z } from 'zod';

const eventCategories = [
  'Cleanup',
  'Plantation',
  'Donation',
  'Healthcare',
  'Education',
  'Relief',
  'Other',
] as const;

export const createEventSchema = z.object({
  title: z
    .string()
    .min(5, 'Event title must be at least 5 characters')
    .max(100, 'Event title cannot exceed 100 characters')
    .trim(),
  description: z
    .string()
    .min(20, 'Event description must be at least 20 characters')
    .trim(),
  eventType: z.enum(eventCategories, {
    error:
      'Event type must be one of: Cleanup, Plantation, Donation, Healthcare, Education, Relief, Other',
  }),
  thumbnailUrl: z
    .string()
    .url('Please provide a valid image URL for the thumbnail')
    .trim(),
  location: z
    .string()
    .min(3, 'Location must be at least 3 characters (e.g. Mirpur 10, Dhaka)')
    .trim(),
  date: z
    .string()
    .or(z.date())
    .transform((val) => new Date(val))
    .refine((date) => !isNaN(date.getTime()), {
      message: 'Invalid date format',
    })
    .refine((date) => date.getTime() > Date.now(), {
      message: 'Event date must be in the future. Past dates cannot be added.',
    }),
});

export const updateEventSchema = createEventSchema.partial();

export type CreateEventInput = z.infer<typeof createEventSchema>;
export type UpdateEventInput = z.infer<typeof updateEventSchema>;