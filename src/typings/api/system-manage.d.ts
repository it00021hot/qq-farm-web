declare namespace Api {
  namespace SystemManage {
    type CommonSearchParams = Pick<Common.PaginatingCommonParams, 'current' | 'size'>;

    type EnableStatus = 1 | 2;

    /** tenant */
    type Tenant = {
      id: number;
      code: string;
      name: string;
      status: EnableStatus;
      maxUsers: number;
      maxAccounts: number;
      expireAt: number;
      contactName: string;
      contactPhone: string;
      remark: string;
      createdAt: number;
      updatedAt: number;
    };

    type TenantSearchParams = CommonType.RecordNullable<
      Pick<Tenant, 'status'> & CommonSearchParams & { keyword?: string }
    >;

    type TenantList = Common.PaginatingQueryRecord<Tenant>;

    type TenantCreateParams = {
      code: string;
      name: string;
      maxUsers?: number;
      maxAccounts?: number;
      expireAt?: number;
      contactName?: string;
      contactPhone?: string;
      remark?: string;
      adminAccount?: string;
      adminPassword?: string;
      adminNickName?: string;
    };

    type TenantUpdateParams = {
      id: number;
      name: string;
      maxUsers?: number;
      maxAccounts?: number;
      expireAt?: number;
      contactName?: string;
      contactPhone?: string;
      remark?: string;
      status: EnableStatus;
    };

    /** admin user */
    type Admin = {
      id: number;
      uuid: string;
      tenantId: number;
      nickName: string;
      realName: string;
      account: string;
      phone: string;
      email: string;
      roleIds: string;
      status: EnableStatus;
      createdAt: number;
      updatedAt: number;
    };

    type AdminSearchParams = CommonType.RecordNullable<
      Pick<Admin, 'status'> & CommonSearchParams & { keyword?: string }
    >;

    type AdminList = Common.PaginatingQueryRecord<Admin>;

    type AdminCreateParams = {
      account: string;
      password: string;
      nickName: string;
      realName?: string;
      phone?: string;
      email?: string;
      roleIds: string;
      status: EnableStatus;
    };

    type AdminUpdateParams = {
      id: number;
      nickName: string;
      realName?: string;
      phone?: string;
      email?: string;
      roleIds: string;
      status: EnableStatus;
      password?: string;
    };

    type PlatformUserCreateParams = {
      account: string;
      password: string;
      nickName: string;
      roleIds: string;
      tenantIds?: number[];
      status: EnableStatus;
    };

    /** role */
    type Role = {
      id: number;
      parentId: number;
      level: number;
      name: string;
      code: string;
      desc: string;
      isSys: number;
      roleType: 1 | 2;
      status: EnableStatus;
      createdAt: number;
      updatedAt: number;
    };

    type RoleCreateParams = {
      parentId?: number;
      name: string;
      code: string;
      desc?: string;
      roleType: 1 | 2;
      status: EnableStatus;
    };

    type RoleUpdateParams = RoleCreateParams & { id: number };

    type RoleAuthParams = {
      roleId: number;
      resourceIds: string;
    };

    /** menu / resource */
    type Menu = {
      id: number;
      name: string;
      alias: string;
      desc: string;
      fUrl: string;
      bUrl: string;
      methods: string;
      icon: string;
      parentId: number;
      path: string;
      resourceType: 1 | 2 | 3;
      hideInMenu: 1 | 2;
      status: EnableStatus;
      sortOrder: number;
      createdAt: number;
      updatedAt: number;
    };

    type MenuCreateParams = {
      name: string;
      alias: string;
      desc?: string;
      fUrl?: string;
      bUrl?: string;
      methods?: string;
      parentId?: number;
      path?: string;
      resourceType: 1 | 2 | 3;
      icon?: string;
      hideInMenu: 1 | 2;
      status: EnableStatus;
      sortOrder?: number;
    };

    type MenuUpdateParams = MenuCreateParams & { id: number };

    /** permission */
    type APIItem = {
      method: string;
      path: string;
      name: string;
    };

    type RolePolicyItem = {
      id: number;
      ptype?: string;
      v0?: string;
      v1?: string;
      v2?: string;
      v3?: string;
      source: string;
    };

    /** attachment */
    type Attachment = {
      id: number;
      tenantId: number;
      userId: number;
      attachName: string;
      attachOriginName: string;
      attachUrl: string;
      attachType: number;
      attachMimetype: string;
      attachExtension: string;
      attachSize: string;
      status: number;
      createdAt: number;
      updatedAt: number;
    };

    type AttachmentSearchParams = CommonType.RecordNullable<
      CommonSearchParams & { keyword?: string; attachType?: number; status?: number }
    >;

    type AttachmentList = Common.PaginatingQueryRecord<Attachment>;
  }
}
