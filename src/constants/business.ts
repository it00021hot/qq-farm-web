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

export function translateStringOptions<T extends string>(
  options: CommonType.Option<T, App.I18n.I18nKey>[]
): CommonType.Option<T, string>[] {
  return options.map(option => ({
    ...option,
    label: $t(option.label)
  }));
}

/** farm enable status ("1" | "2") */
export const farmEnableStatusRecord: Record<Api.Farm.EnableStatus, App.I18n.I18nKey> = {
  '1': 'page.farm.common.status.enable',
  '2': 'page.farm.common.status.disable'
};

export const farmEnableStatusOptions: CommonType.Option<Api.Farm.EnableStatus, App.I18n.I18nKey>[] = [
  { value: '1', label: 'page.farm.common.status.enable' },
  { value: '2', label: 'page.farm.common.status.disable' }
];

/** farm run status */
export const farmRunStatusRecord: Record<Api.Farm.RunStatus, App.I18n.I18nKey> = {
  0: 'page.farm.common.runStatus.stopped',
  1: 'page.farm.common.runStatus.running',
  2: 'page.farm.common.runStatus.error'
};

export const farmRunStatusOptions: CommonType.Option<Api.Farm.RunStatus, App.I18n.I18nKey>[] = [
  { value: 0, label: 'page.farm.common.runStatus.stopped' },
  { value: 1, label: 'page.farm.common.runStatus.running' },
  { value: 2, label: 'page.farm.common.runStatus.error' }
];

/** fertilizer mode */
export const farmFertilizerModeRecord: Record<Api.Farm.FertilizerMode, App.I18n.I18nKey> = {
  none: 'page.farm.common.fertilizerMode.none',
  normal: 'page.farm.common.fertilizerMode.normal',
  organic: 'page.farm.common.fertilizerMode.organic',
  both: 'page.farm.common.fertilizerMode.both',
  smart: 'page.farm.common.fertilizerMode.smart'
};

export const farmFertilizerModeOptions: CommonType.Option<Api.Farm.FertilizerMode, App.I18n.I18nKey>[] = [
  { value: 'both', label: 'page.farm.common.fertilizerMode.both' },
  { value: 'smart', label: 'page.farm.common.fertilizerMode.smart' },
  { value: 'normal', label: 'page.farm.common.fertilizerMode.normal' },
  { value: 'organic', label: 'page.farm.common.fertilizerMode.organic' },
  { value: 'none', label: 'page.farm.common.fertilizerMode.none' }
];

/** fertilizer land types */
export const farmFertilizerLandTypeOptions: CommonType.Option<string, App.I18n.I18nKey>[] = [
  { value: 'purple-gold', label: 'page.farm.settings.landTypePurpleGold' },
  { value: 'gold', label: 'page.farm.settings.landTypeGold' },
  { value: 'black', label: 'page.farm.settings.landTypeBlack' },
  { value: 'red', label: 'page.farm.settings.landTypeRed' },
  { value: 'normal', label: 'page.farm.settings.landTypeNormal' }
];

export const farmAllFertilizerLandTypes = farmFertilizerLandTypeOptions.map(o => o.value);

/** farm platform */
export const farmPlatformRecord: Record<Api.Farm.Platform, App.I18n.I18nKey> = {
  qq: 'page.farm.common.platform.qq',
  wx: 'page.farm.common.platform.wx'
};

export const farmPlatformOptions: CommonType.Option<Api.Farm.Platform, App.I18n.I18nKey>[] = [
  { value: 'qq', label: 'page.farm.common.platform.qq' },
  { value: 'wx', label: 'page.farm.common.platform.wx' }
];

/** card type */
export const farmCardTypeRecord: Record<Api.Farm.CardType, App.I18n.I18nKey> = {
  1: 'page.farm.card.cardType.time',
  2: 'page.farm.card.cardType.quota'
};

export const farmCardTypeOptions: CommonType.Option<Api.Farm.CardType, App.I18n.I18nKey>[] = [
  { value: 1, label: 'page.farm.card.cardType.time' },
  { value: 2, label: 'page.farm.card.cardType.quota' }
];

/** card status */
export const farmCardStatusRecord: Record<Api.Farm.CardStatus, App.I18n.I18nKey> = {
  1: 'page.farm.card.cardStatus.unused',
  2: 'page.farm.card.cardStatus.used',
  3: 'page.farm.card.cardStatus.disabled'
};

export const farmCardStatusOptions: CommonType.Option<Api.Farm.CardStatus, App.I18n.I18nKey>[] = [
  { value: 1, label: 'page.farm.card.cardStatus.unused' },
  { value: 2, label: 'page.farm.card.cardStatus.used' },
  { value: 3, label: 'page.farm.card.cardStatus.disabled' }
];
