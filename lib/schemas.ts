import { z } from 'zod'

// Auth schemas
export const signInSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
})

export const signUpSchema = z.object({
  email: z.string().email('Adresse email invalide'),
  password: z.string()
    .min(6, 'Le mot de passe doit contenir au moins 6 caractères')
    .max(100, 'Le mot de passe ne peut pas dépasser 100 caractères'),
  confirmPassword: z.string(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Les mots de passe ne correspondent pas",
  path: ["confirmPassword"],
})

export const magicLinkSchema = z.object({
  email: z.string().email('Adresse email invalide'),
})

// Expense schemas
export const expenseSchema = z.object({
  amount: z.number()
    .min(0.01, 'Le montant doit être supérieur à 0')
    .max(999999.99, 'Le montant ne peut pas dépasser 999,999.99€'),
  category_id: z.string().min(1, 'Catégorie invalide'),
  description: z.string()
    .max(255, 'La description ne peut pas dépasser 255 caractères')
    .optional(),
  date: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .optional(),
  is_recurring: z.boolean().optional(),
  recurring_expense_id: z.string().uuid().optional(),
})

export const updateExpenseSchema = expenseSchema.partial()

// Quick expense schema (for 2-tap entry)
export const quickExpenseSchema = z.object({
  amount: z.number()
    .min(0.01, 'Le montant doit être supérieur à 0')
    .max(999999.99, 'Le montant ne peut pas dépasser 999,999.99€'),
  category_id: z.string().min(1, 'Catégorie invalide'),
})

// Budget schemas
export const budgetSchema = z.object({
  amount: z.number()
    .min(0, 'Le budget ne peut pas être négatif')
    .max(9999999.99, 'Le budget ne peut pas dépasser 9,999,999.99€'),
  category_id: z.string().min(1, 'Catégorie invalide'),
  month: z.string()
    .regex(/^\d{4}-\d{2}$/, 'Format de mois invalide (YYYY-MM)'),
})

export const updateBudgetSchema = budgetSchema.partial()

// Bulk budget update schema
export const bulkBudgetSchema = z.object({
  budgets: z.array(z.object({
    category_id: z.string().min(1, 'Catégorie invalide'),
    amount: z.number()
      .min(0, 'Le budget ne peut pas être négatif')
      .max(9999999.99, 'Le budget ne peut pas dépasser 9,999,999.99€'),
  })),
  month: z.string()
    .regex(/^\d{4}-\d{2}$/, 'Format de mois invalide (YYYY-MM)'),
})

// Recurring expense schemas
export const recurringExpenseSchema = z.object({
  name: z.string()
    .min(1, 'Le nom est requis')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  amount: z.number()
    .min(0.01, 'Le montant doit être supérieur à 0')
    .max(999999.99, 'Le montant ne peut pas dépasser 999,999.99€'),
  category_id: z.string().min(1, 'Catégorie invalide'),
  day_of_month: z.number()
    .int('Le jour doit être un nombre entier')
    .min(1, 'Le jour doit être entre 1 et 31')
    .max(31, 'Le jour doit être entre 1 et 31')
    .optional(),
  is_active: z.boolean().optional(),
})

export const updateRecurringExpenseSchema = recurringExpenseSchema.partial()

// Date range schema
export const dateRangeSchema = z.object({
  start: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date de début invalide (YYYY-MM-DD)'),
  end: z.string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date de fin invalide (YYYY-MM-DD)'),
}).refine((data) => {
  const start = new Date(data.start)
  const end = new Date(data.end)
  return start <= end
}, {
  message: "La date de début doit être antérieure à la date de fin",
  path: ["start"],
})

// Month selection schema
export const monthSchema = z.string()
  .regex(/^\d{4}-\d{2}$/, 'Format de mois invalide (YYYY-MM)')
  .refine((month) => {
    const [year, monthNum] = month.split('-').map(Number)
    return year >= 2020 && year <= 2030 && monthNum >= 1 && monthNum <= 12
  }, 'Mois invalide')

// Search and filter schemas
export const expenseFiltersSchema = z.object({
  category_id: z.string().min(1).optional(),
  min_amount: z.number().min(0).optional(),
  max_amount: z.number().min(0).optional(),
  description: z.string().max(255).optional(),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  is_recurring: z.boolean().optional(),
})

// Pagination schema
export const paginationSchema = z.object({
  page: z.number().int().min(1).default(1),
  limit: z.number().int().min(1).max(100).default(20),
})

// Export/import schemas
export const exportSchema = z.object({
  format: z.enum(['csv', 'json']).refine(
    (val) => ['csv', 'json'].includes(val),
    { message: 'Format non supporté' }
  ),
  start_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  end_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  categories: z.array(z.string().min(1)).optional(),
})

// Type inference
export type SignInInput = z.infer<typeof signInSchema>
export type SignUpInput = z.infer<typeof signUpSchema>
export type MagicLinkInput = z.infer<typeof magicLinkSchema>
export type ExpenseInput = z.infer<typeof expenseSchema>
export type UpdateExpenseInput = z.infer<typeof updateExpenseSchema>
export type QuickExpenseInput = z.infer<typeof quickExpenseSchema>
export type BudgetInput = z.infer<typeof budgetSchema>
export type UpdateBudgetInput = z.infer<typeof updateBudgetSchema>
export type BulkBudgetInput = z.infer<typeof bulkBudgetSchema>
export type RecurringExpenseInput = z.infer<typeof recurringExpenseSchema>
export type UpdateRecurringExpenseInput = z.infer<typeof updateRecurringExpenseSchema>
export type DateRangeInput = z.infer<typeof dateRangeSchema>
export type MonthInput = z.infer<typeof monthSchema>
export type ExpenseFiltersInput = z.infer<typeof expenseFiltersSchema>
export type PaginationInput = z.infer<typeof paginationSchema>
export type ExportInput = z.infer<typeof exportSchema>

// Validation helpers
export const validateExpense = (data: unknown) => {
  return expenseSchema.safeParse(data)
}

export const validateQuickExpense = (data: unknown) => {
  return quickExpenseSchema.safeParse(data)
}

export const validateBudget = (data: unknown) => {
  return budgetSchema.safeParse(data)
}

export const validateRecurringExpense = (data: unknown) => {
  return recurringExpenseSchema.safeParse(data)
}

// Error formatting helper
export const formatZodError = (error: z.ZodError<any>) => {
  return error.issues.map(err => ({
    field: err.path.join('.'),
    message: err.message
  }))
}