import morgan from "morgan";

// morgan.token("service", () => "CATALOG-SERVICE");
// const requestLogger = morgan(
//   ":service, :method, :url, :status, :response-time ms",
// );

const requestLogger = morgan("combined");

export { requestLogger };
