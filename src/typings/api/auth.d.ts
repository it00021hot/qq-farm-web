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
      tenantId?: number;
    }

    interface UserInfo {
      userId: string;
      userName: string;
      nickName?: string;
      roles: string[];
      buttons: string[];
      tenantId: number;
      uuid?: string;
      roleIds?: string[];
    }

    interface ChangePasswordParams {
      oldPassword: string;
      newPassword: string;
    }
  }
}
