import { v4 as uuidv4 } from "uuid";

const correlationId = (req, res, next) => {
  req.correlationId = uuidv4();

  next();
};

export default correlationId;
