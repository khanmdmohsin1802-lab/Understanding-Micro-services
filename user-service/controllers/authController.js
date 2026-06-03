import { registerUser, loginUser } from "../services/userService.js";
import ApiResponse from "../utils/apiResponse.js";

// registerUserController
const registerUserController = async (req, res, next) => {
  try {
    const registrationData = req.body;

    const data = await registerUser(registrationData);

    res
      .status(201)
      .json(new ApiResponse(201, "User Registered Successfully", data));
  } catch (error) {
    next(error);
  }
};

const loginUserController = async (req, res, next) => {
  const loginCredentials = req.body;

  try {
    const data = await loginUser(loginCredentials);

    res.status(200).json(new ApiResponse(200, "Login successfull", data));
  } catch (error) {
    next(error);
  }
};

export { registerUserController, loginUserController };
