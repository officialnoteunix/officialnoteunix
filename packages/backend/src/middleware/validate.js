export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const errors = {};
      for (const issue of result.error.issues) {
        const path = issue.path.join('.');
        if (!errors[path]) errors[path] = [];
        errors[path].push(issue.message);
      }
      return res.status(400).json({ success: false, message: 'Validation failed', errors });
    }
    req.validatedBody = result.data;
    next();
  };
}
