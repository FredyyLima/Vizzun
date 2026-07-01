import jwt from "jsonwebtoken";

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error("JWT_SECRET nao definido nas variaveis de ambiente.");
}

const TOKEN_COOKIE_NAME = "token";
const TOKEN_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export const signToken = (userId) => jwt.sign({ sub: userId }, JWT_SECRET, { expiresIn: "7d" });

export const setAuthCookie = (res, token) => {
  res.cookie(TOKEN_COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: TOKEN_MAX_AGE_MS,
  });
};

export const clearAuthCookie = (res) => {
  res.clearCookie(TOKEN_COOKIE_NAME);
};

export const requireAuth = (req, res, next) => {
  const token = req.cookies?.[TOKEN_COOKIE_NAME];
  if (!token) {
    return res.status(401).json({ message: "Nao autenticado." });
  }
  try {
    const payload = jwt.verify(token, JWT_SECRET);
    req.userId = payload.sub;
    return next();
  } catch (error) {
    return res.status(401).json({ message: "Sessao invalida ou expirada." });
  }
};
