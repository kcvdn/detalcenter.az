function validate(schema, source = "body") {
  return (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      const details = result.error.flatten();
      const firstFieldError = Object.values(details.fieldErrors)
        .flat()
        .find(Boolean);

      return next({
        statusCode: 400,
        message: firstFieldError || result.error.message || "Validation failed",
        details,
      });
    }

    req[source] = result.data;
    return next();
  };
}

module.exports = validate;
