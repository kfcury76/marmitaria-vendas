import { z } from 'zod'

export const customerInfoSchema = z.object({
  nome: z.string()
    .trim()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome muito longo'),
  telefone: z.string()
    .trim()
    .min(10, 'Telefone inválido')
    .max(15, 'Telefone inválido'),
  endereco: z.string().max(300).optional().default(''),
  observacoes: z.string()
    .max(500, 'Observações muito longas')
    .optional()
    .default(''),
})

export const cartItemSchema = z.object({
  menuItem: z.object({
    id: z.string(),
    name: z.string(),
  }).passthrough(),
  quantity: z.number().int().min(1).max(50),
  totalPrice: z.number().min(0),
}).passthrough()

export const checkoutSchema = z.object({
  cart: z.array(cartItemSchema).min(1, 'Carrinho vazio'),
  customerInfo: customerInfoSchema,
}).passthrough()

export type CheckoutInput = z.infer<typeof checkoutSchema>
