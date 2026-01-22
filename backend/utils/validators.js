// utils/validators.js
import { body, param, query } from 'express-validator';
import validator from 'validator';

class Validators {
  static register() {
    return [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Name is required')
        .isLength({ min: 2, max: 50 })
        .withMessage('Name must be between 2 and 50 characters')
        .custom((name, { req }) => {
          // Check if the name contains the email address
          const email = req.body.email;
          if (email && name.toLowerCase().includes(email.toLowerCase())) {
            throw new Error('Name cannot contain your email address. We recommend using a name instead.');
          }
          return true;
        }),

      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email')
        .normalizeEmail(),

      body('password')
        .notEmpty()
        .withMessage('Password is required')
        .isLength({ min: 6 })
        .withMessage('Password must be at least 6 characters')
    ];
  }

  static login() {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email is required')
        .isEmail()
        .withMessage('Please provide a valid email'),

      body('password')
        .notEmpty()
        .withMessage('Password is required')
    ];
  }

  static validateInvite() {
    return [
      body('email')
        .trim()
        .notEmpty()
        .withMessage('Email address is required.')
        .isEmail()
        .withMessage('Please provide a valid email address.')
        .normalizeEmail(),
      body('role')
        .optional()
        .isIn(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', 'BILLING'])
        .withMessage('Invalid role specified.')
    ];
  }

  static validateRoleUpdate() {
    return [
      param('userId')
        .notEmpty()
        .withMessage('User ID parameter is required'),
      body('role')
        .notEmpty()
        .withMessage('Role is required')
        .isIn(['OWNER', 'ADMIN', 'MANAGER', 'MEMBER', 'VIEWER', 'BILLING'])
        .withMessage('Invalid role specified.')
    ];
  }

  static createProject() {
    return [
      body('name')
        .trim()
        .notEmpty()
        .withMessage('Project name is required')
        .isLength({ min: 2, max: 100 })
        .withMessage('Project name must be between 2 and 100 characters'),

      body('key')
        .trim()
        .notEmpty()
        .withMessage('Project key is required')
        .isLength({ min: 2, max: 10 })
        .withMessage('Project key must be between 2 and 10 characters')
        .matches(/^[A-Z0-9]+$/)
        .withMessage('Project key must contain only uppercase letters and numbers'),

      body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Description cannot exceed 1000 characters'),

      body('leadId')
        .notEmpty()
        .withMessage('Project lead ID is required')
        .isString()
        .isLength({ min: 25, max: 25 })
        .withMessage('Invalid lead ID format'),

      body('memberIds')
        .optional()
        .isArray()
        .withMessage('Members must be an array of user IDs')
        .custom((ids) => {
          if (!Array.isArray(ids)) return false;
          return ids.every(id => typeof id === 'string' && id.length > 0);
        })
        .withMessage('Each member ID in the array must be a non-empty string'),
    ];
  }

  static createIssue() {
    const validIssueTypes = ['TASK', 'BUG', 'STORY', 'EPIC'];
    const validPriorities = ['LOWEST', 'LOW', 'MEDIUM', 'HIGH', 'HIGHEST'];
    const validStatuses = ['BACKLOG', 'TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'CLOSED'];

    return [
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Issue title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),

      body('description')
        .optional()
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Description is too long'),

      body('projectId')
        .notEmpty()
        .withMessage('Project ID is required')
        .isString()
        .withMessage('Project ID must be a string')
        .isLength({ min: 1 })
        .withMessage('Invalid project ID format'),

      body('columnId')
        .notEmpty()
        .withMessage('Column ID is required')
        .isString()
        .withMessage('Column ID must be a string')
        .isLength({ min: 1 })
        .withMessage('Invalid column ID format'),

      body('reporterId')
        .notEmpty()
        .withMessage('Reporter ID is required')
        .isString()
        .withMessage('Reporter ID must be a string')
        .isLength({ min: 1 })
        .withMessage('Invalid reporter ID format'),

      body('assigneeId')
        .optional({ nullable: true, checkFalsy: true })
        .isString()
        .withMessage('Assignee ID must be a string')
        .isLength({ min: 1 })
        .withMessage('Invalid assignee ID format'),

      body('status')
        .notEmpty()
        .withMessage('Status is required')
        .isIn(validStatuses)
        .withMessage(`Status must be one of: ${validStatuses.join(', ')}`),

      body('type')
        .notEmpty()
        .withMessage('Issue type is required')
        .isIn(validIssueTypes)
        .withMessage(`Type must be one of: ${validIssueTypes.join(', ')}`),

      body('priority')
        .notEmpty()
        .withMessage('Priority is required')
        .isIn(validPriorities)
        .withMessage(`Priority must be one of: ${validPriorities.join(', ')}`)
    ];
  }

  static createComment() {
    return [
      param('issueId')
        .notEmpty()
        .withMessage('Issue ID parameter is required')
        .isString()
        .withMessage('Issue ID must be a string')
        .isLength({ min: 1 })
        .withMessage('Invalid issue ID format'),

      body('body')
        .trim()
        .notEmpty()
        .withMessage('Comment body is required')
        .isLength({ min: 1, max: 1000 })
        .withMessage('Comment must be between 1 and 1000 characters'),
    ];
  }

  static validateId(paramName = 'id') {
    return [
      param(paramName)
        .notEmpty()
        .withMessage(`${paramName} parameter is required`)
        .isString()
        .withMessage(`Invalid ${paramName}: must be a string`)
        .isLength({ min: 1 })
        .withMessage(`Invalid ${paramName} format`)
    ];
  }

  static search() {
    return [
      query('query')
        .trim()
        .notEmpty()
        .withMessage('Search query is required')
        .isLength({ min: 2 })
        .withMessage('Search query must be at least 2 characters')
    ];
  }

  static validateEpicUpdate() {
    const validEpicStatuses = ['OPEN', 'IN_PROGRESS', 'DONE', 'BLOCKED'];

    return [
      body('title')
        .optional()
        .trim()
        .notEmpty()
        .withMessage('Title cannot be empty if provided')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),

      body('description')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Description is too long'),

      body('status')
        .optional()
        .isIn(validEpicStatuses)
        .withMessage(`Status must be one of: ${validEpicStatuses.join(', ')}`),

      body('ownerUserId')
        .optional({ nullable: true, checkFalsy: true })
        .isString()
        .withMessage('Owner User ID must be a string')
        .isLength({ min: 1 })
        .withMessage('Invalid owner User ID format'),

      body('startDate')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .toDate()
        .withMessage('Start Date must be a valid date string (ISO8601 format)'),

      body('endDate')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .toDate()
        .withMessage('End Date must be a valid date string (ISO8601 format)'),

      body('endDate').custom((endDate, { req }) => {
        const startDate = req.body.startDate;
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
          throw new Error('End Date cannot be before Start Date');
        }
        return true;
      }),
    ];
  }

  static validateEpicCreate() {
    const validEpicStatuses = ['OPEN', 'IN_PROGRESS', 'DONE', 'BLOCKED'];

    return [
      body('title')
        .trim()
        .notEmpty()
        .withMessage('Title is required')
        .isLength({ min: 3, max: 200 })
        .withMessage('Title must be between 3 and 200 characters'),

      body('description')
        .optional({ nullable: true })
        .trim()
        .isLength({ max: 5000 })
        .withMessage('Description is too long'),

      body('status')
        .optional()
        .isIn(validEpicStatuses)
        .withMessage(`Status must be one of: ${validEpicStatuses.join(', ')}`),

      body('ownerUserId')
        .optional({ nullable: true, checkFalsy: true })
        .isString()
        .withMessage('Owner User ID must be a string'),

      body('startDate')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .toDate()
        .withMessage('Start Date must be a valid date string (ISO8601 format)'),

      body('endDate')
        .optional({ nullable: true, checkFalsy: true })
        .isISO8601()
        .toDate()
        .withMessage('End Date must be a valid date string (ISO8601 format)'),

      body('endDate').custom((endDate, { req }) => {
        const startDate = req.body.startDate;
        if (startDate && endDate && new Date(endDate) < new Date(startDate)) {
          throw new Error('End Date cannot be before Start Date');
        }
        return true;
      }),
    ];
  }
}

export default Validators;