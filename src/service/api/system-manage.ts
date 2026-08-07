import { request } from '../request';

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
