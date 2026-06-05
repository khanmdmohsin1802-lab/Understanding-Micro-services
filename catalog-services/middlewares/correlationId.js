import { v4 as uuidv4 } from "uuid";
import asyncLocalStorage from "../utils/requestContext.js";

const correlationIdMiddleware = (req, res, next) => {
  const cid = uuidv4();
  req.correlationId = cid;
  asyncLocalStorage.run({ correlationId: cid }, () => next());
};

export default correlationIdMiddleware;
