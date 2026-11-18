/**
 * Request Validation Middleware & Sanitization Helpers
 */

const USERNAME_REGEX = /^[a-zA-Z0-9_]{4,30}$/;
const DATE_REGEX = /^\d{4}-\d{2}-\d{2}$/;

// Password rules: min 12 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
function validatePasswordStrength(password) {
  if (typeof password !== 'string') return false;
  if (password.length < 12) return false;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /[0-9]/.test(password);
  const hasSpecial = /[^A-Za-z0-9]/.test(password);
  return hasUpper && hasLower && hasNumber && hasSpecial;
}

function isValidDate(dateString) {
  if (!DATE_REGEX.test(dateString)) return false;
  const date = new Date(dateString + 'T00:00:00Z');
  return !isNaN(date.getTime()) && date.toISOString().startsWith(dateString);
}

// Register input validator
function validateRegisterInput(req, res, next) {
  const { username, password } = req.body;

  if (!username || typeof username !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Username is required.'
    });
  }

  const trimmedUsername = username.trim();
  if (!USERNAME_REGEX.test(trimmedUsername)) {
    return res.status(400).json({
      success: false,
      message: 'Username must be between 4 and 30 characters and contain only letters, numbers, and underscores.'
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password is required.'
    });
  }

  if (!validatePasswordStrength(password)) {
    return res.status(400).json({
      success: false,
      message: 'Password must be at least 12 characters long and include at least one uppercase letter, one lowercase letter, one number, and one special character.'
    });
  }

  req.body.username = trimmedUsername;
  next();
}

// Login input validator
function validateLoginInput(req, res, next) {
  const { username, password } = req.body;

  if (!username || typeof username !== 'string' || !username.trim()) {
    return res.status(400).json({
      success: false,
      message: 'Username is required.'
    });
  }

  if (!password || typeof password !== 'string') {
    return res.status(400).json({
      success: false,
      message: 'Password is required.'
    });
  }

  req.body.username = username.trim();
  next();
}

// Task creation and update validator
function validateTaskInput(req, res, next) {
  const { title, description, due_date } = req.body;

  if (req.method === 'POST' || title !== undefined) {
    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: 'Task title is required and cannot be empty.'
      });
    }

    if (title.trim().length > 255) {
      return res.status(400).json({
        success: false,
        message: 'Task title cannot exceed 255 characters.'
      });
    }

    req.body.title = title.trim();
  }

  if (description !== undefined && description !== null) {
    if (typeof description !== 'string') {
      return res.status(400).json({
        success: false,
        message: 'Description must be a string.'
      });
    }
    req.body.description = description.trim();
  }

  if (due_date !== undefined && due_date !== null && due_date !== '') {
    // accept YYYY-MM-DD or ISO timestamp
    const datePart = due_date.split('T')[0];
    if (!isValidDate(datePart)) {
      return res.status(400).json({
        success: false,
        message: 'Due date must be in YYYY-MM-DD format.'
      });
    }
    req.body.due_date = datePart;
  } else if (due_date === '' || due_date === null) {
    req.body.due_date = null;
  }

  next();
}

// Historical daily report validation
function validateDailyHistory(req, res, next) {
  const { date } = req.query;
  if (!date || !isValidDate(date)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing "date" query parameter. Expected YYYY-MM-DD.'
    });
  }
  next();
}

// Historical monthly report validation
function validateMonthlyHistory(req, res, next) {
  const { month, year } = req.query;
  const monthNum = parseInt(month, 10);
  const yearNum = parseInt(year, 10);

  if (isNaN(monthNum) || monthNum < 1 || monthNum > 12) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing "month" parameter. Expected a value between 1 and 12.'
    });
  }

  if (isNaN(yearNum) || yearNum < 1970 || yearNum > 2100) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing "year" parameter. Expected 4-digit year.'
    });
  }

  req.validatedMonth = monthNum;
  req.validatedYear = yearNum;
  next();
}

// Historical date range report validation
function validateRangeHistory(req, res, next) {
  const { startDate, endDate } = req.query;

  if (!startDate || !isValidDate(startDate)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing "startDate" parameter. Expected YYYY-MM-DD.'
    });
  }

  if (!endDate || !isValidDate(endDate)) {
    return res.status(400).json({
      success: false,
      message: 'Invalid or missing "endDate" parameter. Expected YYYY-MM-DD.'
    });
  }

  if (startDate > endDate) {
    return res.status(400).json({
      success: false,
      message: '"startDate" cannot be after "endDate".'
    });
  }

  next();
}

module.exports = {
  validateRegisterInput,
  validateLoginInput,
  validateTaskInput,
  validateDailyHistory,
  validateMonthlyHistory,
  validateRangeHistory,
  validatePasswordStrength,
  isValidDate
};
