import Joi from 'joi';

export const userSchema = Joi.object({
  name: Joi.string()
    .required()
    .messages({ 'any.required': 'Name is required' }),
  email: Joi.string()
    .email()
    .required()
    .messages({ 'any.required': 'Email is required' }),
  password: Joi.string()
    .required()
    .messages({ 'any.required': 'Password is required' })
    .min(8),
  phone: Joi.number()
    .required()
    .messages({ 'any.required': 'Phone is required' }),
  userType: Joi.string(),
  gender: Joi.string()
    .required()
    .messages({ 'any.required': 'Gender is required' }),
  DOB: Joi.string().required().messages({ 'any.required': 'DOB is required' }),
});

export const loginSchema = Joi.object({
  email: Joi.string()
    .email()
    .required()
    .messages({ 'any.required': 'Email is required' }),
  password: Joi.string()
    .required()
    .messages({ 'any.required': 'Password is required' })
    .min(8),
});

export const resetPasswordSchema = Joi.object({
  newPassword: Joi.string()
    .required()
    .messages({ 'any.required': 'Password is required' })
    .min(8),
    confirmPassword: Joi.string()
    .valid(Joi.ref('newPassword'))
    .messages({
      'any.only': 'The two passwords do not match',
      'any.required': 'Please re-enter the password',
    }),
});

// Define a Joi schema for the route
const routeSchema = Joi.object({
  pickup: Joi.string().required(),
  destination: Joi.string().required(),
  price: Joi.number().required().min(0),
});

const routePriceSchema = Joi.object({
  price: Joi.number().required().min(0),
});

interface Route {
  pickup: string;
  destination: string;
  price: number;
}
interface Price {
  price: number;
}
// Validate a route object against the schema
export function validateRoute(route: Route) {
  return routeSchema.validate(route);
}

// Validate a route  price against the schema
export function validateRoutePrice(price: Price) {
  return routePriceSchema.validate(price);
}
