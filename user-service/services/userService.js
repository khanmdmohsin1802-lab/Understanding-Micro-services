import { findUser, createUser } from "../repositories/userRepository.js";
import AppError from "../errors/appError.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";

const registerUser = async (registrationData) => {
  const { email, password, role } = registrationData;

  const userExist = await findUser(email);
  console.log(userExist);
  if (userExist) {
    throw new AppError("User Already Exists", 409);
  }

  const salt = await bcrypt.genSalt(10);
  const passwordhash = await bcrypt.hash(password, salt);

  const newUser = await createUser(email, passwordhash, role);
  return newUser;
};

const loginUser = async (loginCredentials) => {
  const { email, password } = loginCredentials;

  const user = await findUser(email);

  if (!user) {
    throw new AppError("Invalid Credentials", 401);
  }

  const isMatch = await bcrypt.compare(password, user.password_hash);

  if (!isMatch) {
    throw new AppError("Invalid credentials", 401);
  }

  const token = jwt.sign(
    { id: user.id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "24h" },
  );

  return {
    userId: user.id,
    userEmail: user.email,
    userRole: user.role,
    token: token,
  };
};

export { registerUser, loginUser };
