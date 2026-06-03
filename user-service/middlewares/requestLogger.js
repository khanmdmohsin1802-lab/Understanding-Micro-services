import morgan from "morgan";

morgan.token("service", () => "USER-SERVICE");

const requestLogger = morgan(
  ":service, :method, :url, :status, :response-time (ms)",
);

export default requestLogger;
