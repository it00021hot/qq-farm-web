import { request } from '../request';

/** ========== Tenant (/platform) ========== */
export function fetchGetTenantList(params?: Api.SystemManage.TenantSearchParams) {
  return request<Api.SystemManage.TenantList>({
    url: '/platform/tenant/list',
    method: 'get',
    params
  });
}

export function fetchGetTenantDetail(id: number) {
  return request<Api.SystemManage.Tenant>({
    url: '/platform/tenant/detail',
    method: 'get',
    params: { id }
  });
}

export function fetchCreateTenant(data: Api.SystemManage.TenantCreateParams) {
  return request({ url: '/platform/tenant/add', method: 'post', data });
}

export function fetchUpdateTenant(data: Api.SystemManage.TenantUpdateParams) {
  return request({ url: '/platform/tenant/modify', method: 'post', data });
}

export function fetchUpdateTenantStatus(id: number, status: Api.SystemManage.EnableStatus) {
  return request({ url: '/platform/tenant/status', method: 'post', data: { id, status } });
}

export function fetchBindTenant(adminId: number, tenantIds: number[]) {
  return request({ url: '/platform/tenant/bind', method: 'post', data: { adminId, tenantIds } });
}

/** ========== Admin (/system) ========== */
export function fetchGetAdminList(params?: Api.SystemManage.AdminSearchParams) {
  return request<Api.SystemManage.AdminList>({
    url: '/system/admin/list',
    method: 'get',
    params
  });
}

export function fetchCreateAdmin(data: Api.SystemManage.AdminCreateParams) {
  return request({ url: '/system/admin/add', method: 'post', data });
}

export function fetchUpdateAdmin(data: Api.SystemManage.AdminUpdateParams) {
  return request({ url: '/system/admin/modify', method: 'post', data });
}

export function fetchUpdateAdminStatus(id: number, status: Api.SystemManage.EnableStatus) {
  return request({ url: '/system/admin/status', method: 'post', data: { id, status } });
}

export function fetchCreatePlatformUser(data: Api.SystemManage.PlatformUserCreateParams) {
  return request({ url: '/system/platform-user/add', method: 'post', data });
}

/** ========== Role (/platform) ========== */
export function fetchGetRoleTree() {
  return request<Api.SystemManage.Role[]>({ url: '/platform/role/tree', method: 'get' });
}

export function fetchGetAssignableRoles() {
  return request<Api.SystemManage.Role[]>({ url: '/platform/role/assignable', method: 'get' });
}

export function fetchCreateRole(data: Api.SystemManage.RoleCreateParams) {
  return request({ url: '/platform/role/add', method: 'post', data });
}

export function fetchUpdateRole(data: Api.SystemManage.RoleUpdateParams) {
  return request({ url: '/platform/role/modify', method: 'post', data });
}

export function fetchDeleteRole(id: number) {
  return request({ url: '/platform/role/delete', method: 'post', data: { id } });
}

export function fetchGetRoleAuth(roleId: number) {
  return request<{ resourceIds: string | number[] }>({
    url: '/platform/role/auth',
    method: 'get',
    params: { roleId }
  });
}

export function fetchSetRoleAuth(data: Api.SystemManage.RoleAuthParams) {
  return request({ url: '/platform/role/auth', method: 'post', data });
}

/** ========== Menu (/platform) ========== */
export function fetchGetMenuTree() {
  return request<Api.SystemManage.Menu[]>({ url: '/platform/menu/tree', method: 'get' });
}

export function fetchCreateMenu(data: Api.SystemManage.MenuCreateParams) {
  return request({ url: '/platform/menu/add', method: 'post', data });
}

export function fetchUpdateMenu(data: Api.SystemManage.MenuUpdateParams) {
  return request({ url: '/platform/menu/modify', method: 'post', data });
}

export function fetchDeleteMenu(id: number) {
  return request({ url: '/platform/menu/delete', method: 'post', data: { id } });
}

/** ========== Permission (/platform) ========== */
export function fetchGetPermissionApis() {
  return request<Api.SystemManage.APIItem[]>({ url: '/platform/permission/apis', method: 'get' });
}

export function fetchGetRolePolicies(id: number) {
  return request<Api.SystemManage.RolePolicyItem[]>({
    url: '/platform/permission/role-policies',
    method: 'get',
    params: { id }
  });
}

export function fetchReloadPermission() {
  return request({ url: '/platform/permission/reload', method: 'post' });
}

/** ========== Attachment (/system) ========== */
export function fetchGetAttachmentList(params?: Api.SystemManage.AttachmentSearchParams) {
  return request<Api.SystemManage.AttachmentList>({
    url: '/system/attachment/list',
    method: 'get',
    params
  });
}

export function fetchGetAttachmentDetail(id: number) {
  return request<Api.SystemManage.Attachment>({
    url: '/system/attachment/detail',
    method: 'get',
    params: { id }
  });
}

export function fetchUploadAttachment(file: File, filePath?: string) {
  const form = new FormData();
  form.append('file', file);
  if (filePath) form.append('filePath', filePath);
  return request({
    url: '/system/attachment/upload',
    method: 'post',
    data: form,
    headers: { 'Content-Type': 'multipart/form-data' }
  });
}

export function fetchAttachmentAccessURL(filePath: string) {
  return request<{ filePath: string; signedUrl: string; expire: number }>({
    url: '/system/attachment/access-url',
    method: 'post',
    data: { filePath }
  });
}

export function fetchUpdateAttachmentStatus(id: number, status: number) {
  return request({ url: '/system/attachment/status', method: 'post', data: { id, status } });
}

export function fetchDeleteAttachment(id: number) {
  return request({ url: '/system/attachment/delete', method: 'post', data: { id } });
}
