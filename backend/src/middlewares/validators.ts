import { body, param } from 'express-validator';

export const createPlantValidation = [
  body('name')
    .trim()
    .notEmpty()
    .withMessage('Plant name is required')
    .isLength({ max: 100 })
    .withMessage('Plant name must be less than 100 characters'),
  body('species')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Species must be less than 100 characters'),
  body('userId')
    .notEmpty()
    .withMessage('User ID is required')
    .isUUID()
    .withMessage('Invalid user ID format'),
];

export const updatePlantValidation = [
  param('id').isUUID().withMessage('Invalid plant ID format'),
  body('name')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Plant name must be less than 100 characters'),
  body('species')
    .optional()
    .trim()
    .isLength({ max: 100 })
    .withMessage('Species must be less than 100 characters'),
];

export const plantIdValidation = [
  param('id').isUUID().withMessage('Invalid plant ID format'),
];
