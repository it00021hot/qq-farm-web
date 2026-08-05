import { $t } from '@/locales';

export const enableStatusRecord: Record<Api.SystemManage.EnableStatus, App.I18n.I18nKey> = {
  1: 'page.system.common.status.enable',
  2: 'page.system.common.status.disable'
};

export const enableStatusOptions: CommonType.Option<Api.SystemManage.EnableStatus, App.I18n.I18nKey>[] = [
  { value: 1, label: 'page.system.common.status.enable' },
  { value: 2, label: 'page.system.common.status.disable' }
];

export const attachmentStatusRecord: Record<1 | 0, App.I18n.I18nKey> = {
  1: 'page.system.common.status.normal',
  0: 'page.system.common.status.deleted'
};

export const attachmentStatusOptions: CommonType.Option<1 | 0, App.I18n.I18nKey>[] = [
  { value: 1, label: 'page.system.common.status.normal' },
  { value: 0, label: 'page.system.common.status.deleted' }
];

export const resourceTypeRecord: Record<Api.SystemManage.Menu['resourceType'], App.I18n.I18nKey> = {
  1: 'page.system.menu.resourceType.directory',
  2: 'page.system.menu.resourceType.menu',
  3: 'page.system.menu.resourceType.button'
};

export const resourceTypeOptions: CommonType.Option<Api.SystemManage.Menu['resourceType'], App.I18n.I18nKey>[] = [
  { value: 1, label: 'page.system.menu.resourceType.directory' },
  { value: 2, label: 'page.system.menu.resourceType.menu' },
  { value: 3, label: 'page.system.menu.resourceType.button' }
];

export const roleTypeRecord: Record<Api.SystemManage.Role['roleType'], App.I18n.I18nKey> = {
  1: 'page.system.role.roleType.platform',
  2: 'page.system.role.roleType.tenant'
};

export const roleTypeOptions: CommonType.Option<Api.SystemManage.Role['roleType'], App.I18n.I18nKey>[] = [
  { value: 1, label: 'page.system.role.roleType.platform' },
  { value: 2, label: 'page.system.role.roleType.tenant' }
];

export function translateNumberOptions<T extends number>(
  options: CommonType.Option<T, App.I18n.I18nKey>[]
): CommonType.Option<T, string>[] {
  return options.map(option => ({
    ...option,
    label: $t(option.label)
  }));
}
