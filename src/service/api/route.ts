import { request } from '../request';

/** get constant routes from backend (unused when using local fallback) */
export function fetchGetConstantRoutes() {
  return request<Api.Route.MenuRoute[]>({ url: '/auth/constant-routes' });
}

/** get user routes */
export function fetchGetUserRoutes() {
  return request<Api.Route.UserRoute>({ url: '/auth/user-routes' });
}

/**
 * whether the route is exist (dynamic mode uses local route tree in route store;
 * this helper is kept for static/compat callers)
 *
 * @param routeName route name
 */
export function fetchIsRouteExist(_routeName: string) {
  return Promise.resolve({ data: false, error: null, response: null });
}
