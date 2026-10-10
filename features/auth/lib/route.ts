export const AUTH_ROUTES = {
  signIn: "/sign-in",
  home: "/",
};

export const PROTECTED_ROUTES = [AUTH_ROUTES.home];
export const GUEST_ONLY_ROUTES = [AUTH_ROUTES.signIn];
