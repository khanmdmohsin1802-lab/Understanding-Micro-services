const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      schema.parse(req.body);
      next();
    } catch (error) {
      return res.status(400).json({
        error: "validation fail",
        details: error.errors,
      });
    }
  };
};

export { validateRequest };
