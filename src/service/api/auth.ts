import { request } from '../request';

/**
 * Login
 *
 * @param userName User name
 * @param password Password
 */
export function fetchLogin(userName: string, password: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/login',
    method: 'post',
    data: {
      userName,
      password
    }
  });
}

/** Get user info */
export function fetchGetUserInfo() {
  return request<Api.Auth.UserInfo>({ url: '/auth/info' });
}

/**
 * Refresh token
 *
 * @param refreshToken Refresh token
 */
export function fetchRefreshToken(refreshToken: string) {
  return request<Api.Auth.LoginToken>({
    url: '/auth/refresh',
    method: 'post',
    data: {
      refreshToken
    }
  });
}

/** Logout */
export function fetchLogout() {
  return request({ url: '/auth/logout', method: 'post' });
}

/** Change current user password */
export function fetchChangePassword(data: Api.Auth.ChangePasswordParams) {
  return request({
    url: '/auth/password',
    method: 'post',
    data
  });
}
