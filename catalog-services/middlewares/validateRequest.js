const validateRequest = (schema) => {
  return async (req, res, next) => {
    try {
      const parsedData = await schema.parseAsync({
        body: req.body,
        params: req.params,
      });

      req.body = parsedData.body;
      req.params = parsedData.params;

      next();
    } catch (error) {
      next(error);
    }
  };
};

export default validateRequest;
