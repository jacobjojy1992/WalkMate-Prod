// src/server/middleware/validation.ts
import { Request, Response, NextFunction } from 'express';

interface ValidationRules {
  [key: string]: {
    required?: boolean;
    type?: 'string' | 'number' | 'boolean' | 'date';
    min?: number;
    max?: number;
  };
}

/**
 * Middleware to validate request data against a set of rules
 * @param rules Validation rules to apply
 * @param source Where to find the data (body, params, or query)
 * @returns Express middleware function
 */
export const validateRequest = (rules: ValidationRules, source: 'body' | 'params' | 'query' = 'body') => {
  return (req: Request, res: Response, next: NextFunction) => {
    // Get the data to validate (from body, params, or query)
    const data = source === 'body' ? req.body : source === 'params' ? req.params : req.query;
    const errors: string[] = [];
    
    // Check each field against rules
    Object.entries(rules).forEach(([field, rule]) => {
      const value = data[field];
      
      // Check if required field is missing
      if (rule.required && (value === undefined || value === null || value === '')) {
        errors.push(`${field} is required`);
        return;
      }
      
      // Skip additional validation if field is not provided and not required
      if (value === undefined || value === null) {
        return;
      }
      
      // Type validation
      if (rule.type) {
        if (rule.type === 'number') {
          const numValue = Number(value);
          if (isNaN(numValue)) {
            errors.push(`${field} must be a number`);
            return;
          }
          
          // Range validation for numbers
          if (rule.min !== undefined && numValue < rule.min) {
            errors.push(`${field} must be at least ${rule.min}`);
          }
          
          if (rule.max !== undefined && numValue > rule.max) {
            errors.push(`${field} must be at most ${rule.max}`);
          }
        } else if (rule.type === 'date') {
          const dateValue = new Date(value);
          if (isNaN(dateValue.getTime())) {
            errors.push(`${field} must be a valid date`);
          }
        }
      }
    });
    
    // If there are validation errors, return them
    if (errors.length > 0) {
      return res.status(400).json({
        success: false,
        errors
      });
    }
    
    // If validation passes, proceed to the next middleware
    next();
  };
};