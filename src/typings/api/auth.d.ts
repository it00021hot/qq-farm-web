declare namespace Api {
  /**
   * namespace Auth
   *
   * backend api module: "auth"
   */
  namespace Auth {
    interface LoginToken {
      token: string;
      refreshToken: string;
    }

    interface UserInfo {
      userId: string;
      userName: string;
      nickName?: string;
      roles: string[];
      buttons: string[];
      uuid?: string;
      roleIds?: string[];
    }

    interface ChangePasswordParams {
      oldPassword: string;
      newPassword: string;
    }
  }
}
