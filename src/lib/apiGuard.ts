import { NextRequest } from "next/server";

export class AuthorizationError extends Error {
  status = 403;
}

export const assertSameOrigin = (req: NextRequest) => {
  const origin = req.headers.get("origin");
  if (!origin) return;
  if (origin !== req.nextUrl.origin) {
    throw new AuthorizationError("Cross-origin request is not allowed");
  }
};
