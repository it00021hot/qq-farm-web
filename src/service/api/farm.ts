import { request } from '../request';

/** ========== Account ========== */
function cleanAccountListParams(params?: Api.Farm.AccountSearchParams) {
  if (!params) return undefined;
  const out: Record<string, string | number> = {};
  if (params.current != null) out.current = params.current;
  if (params.size != null) out.size = params.size;
  if (params.keyword) out.keyword = params.keyword;
  if (params.platform) out.platform = params.platform;
  if (params.status != null && params.status !== ('' as any)) out.status = params.status as any;
  if (params.runStatus != null && params.runStatus !== ('' as any)) out.runStatus = params.runStatus as any;
  return out;
}

export function fetchGetFarmAccountList(params?: Api.Farm.AccountSearchParams) {
  return request<Api.Farm.AccountList>({
    url: '/farm/account/list',
    method: 'get',
    params: cleanAccountListParams(params)
  });
}

export function fetchAddFarmAccount(data: Api.Farm.AccountCreateParams) {
  return request({ url: '/farm/account/add', method: 'post', data });
}

export function fetchModifyFarmAccount(data: Api.Farm.AccountUpdateParams) {
  return request({ url: '/farm/account/modify', method: 'post', data });
}

export function fetchDeleteFarmAccount(id: number) {
  return request({ url: '/farm/account/delete', method: 'post', data: { id } });
}

export function fetchStartFarmAccount(id: number) {
  return request({ url: '/farm/account/start', method: 'post', data: { id } });
}

export function fetchStopFarmAccount(id: number) {
  return request({ url: '/farm/account/stop', method: 'post', data: { id } });
}

/** ========== Status ========== */
export function fetchGetFarmStatusDetail(accountId: number) {
  return request<Api.Farm.Status>({
    url: '/farm/status/detail',
    method: 'get',
    params: { accountId }
  });
}

/** ========== Run logs ========== */
export function fetchGetFarmLogs(params?: Api.Farm.LogsSearchParams) {
  return request<Api.Farm.LogEntry[]>({
    url: '/farm/logs',
    method: 'get',
    params: {
      accountId: params?.accountId,
      module: params?.module || undefined,
      keyword: params?.keyword || undefined,
      limit: params?.limit
    }
  });
}

export function fetchClearFarmLogs(accountId?: number) {
  return request<{ cleared: number | string; accountId?: number }>({
    url: '/farm/logs',
    method: 'delete',
    params: accountId ? { accountId } : undefined
  });
}

/** ========== Automation ========== */
export function fetchGetFarmAutomationDetail(accountId: number) {
  return request<Api.Farm.AccountAutomationDetail>({
    url: '/farm/automation/detail',
    method: 'get',
    params: { accountId }
  });
}

export function fetchModifyFarmAutomation(data: Api.Farm.AccountAutomationModifyParams) {
  return request({ url: '/farm/automation/modify', method: 'post', data });
}

/** ========== Lands / Operate / Bag ========== */
export function fetchGetFarmLands(accountId: number) {
  return request<Api.Farm.LandsResponse>({
    url: '/farm/lands',
    method: 'get',
    params: { accountId }
  });
}

export function fetchFarmOperate(data: Api.Farm.OperateParams) {
  return request<Api.Farm.OperateResult>({
    url: '/farm/operate',
    method: 'post',
    data
  });
}

export function fetchGetFarmBag(accountId: number) {
  return request<Api.Farm.BagResponse>({
    url: '/farm/bag',
    method: 'get',
    params: { accountId }
  });
}

export function fetchGetFarmSeeds(accountId: number) {
  return request<Api.Farm.AvailableShopSeed[]>({
    url: '/farm/seeds',
    method: 'get',
    params: { accountId }
  });
}

export function fetchSellFarmBag(data: Api.Farm.BagSellParams) {
  return request<Api.Farm.BagSellResult>({
    url: '/farm/bag/sell',
    method: 'post',
    data
  });
}

/** ========== Friend ========== */
export function fetchGetFarmFriendList(params?: Api.Farm.FriendSearchParams) {
  return request<Api.Farm.FriendList>({
    url: '/farm/friend/list',
    method: 'get',
    params
  });
}

export function fetchSyncFarmFriends(accountId: number) {
  return request<Api.Farm.FriendSyncResult>({
    url: '/farm/friend/sync',
    method: 'post',
    data: { accountId }
  });
}

export function fetchGetFarmFriendLands(params: Api.Farm.FriendLandsParams) {
  return request<Api.Farm.LandsResponse>({
    url: '/farm/friend/lands',
    method: 'get',
    params
  });
}

export function fetchFarmFriendOp(data: Api.Farm.FriendOpParams) {
  return request<Api.Farm.FriendOpResult>({
    url: '/farm/friend/op',
    method: 'post',
    data
  });
}

export function fetchGetFarmFriendInteractRecords(accountId: number) {
  return request<Api.Farm.FriendInteractRecord[]>({
    url: '/farm/friend/interact-records',
    method: 'get',
    params: { accountId }
  });
}

/** ========== Activity ========== */
export function fetchGetFarmActivitySnapshot(accountId: number) {
  return request<Api.Farm.ActivitySnapshot>({
    url: '/farm/activity/snapshot',
    method: 'get',
    params: { accountId }
  });
}

export function fetchClaimFarmActivityPass(data: Api.Farm.ActivityClaimParams) {
  return request<Api.Farm.ActivitySnapshot>({ url: '/farm/activity/pass/claim', method: 'post', data });
}

export function fetchLightFarmActivityConstellation(data: Api.Farm.ActivityClaimParams) {
  return request<Api.Farm.ActivitySnapshot>({ url: '/farm/activity/constellation/light', method: 'post', data });
}

export function fetchExchangeFarmActivityShop(data: Api.Farm.ActivityClaimParams) {
  return request<Api.Farm.ActivitySnapshot>({ url: '/farm/activity/shop/exchange', method: 'post', data });
}

export function fetchClaimFarmActivitySolarTerm(data: Api.Farm.ActivityClaimParams) {
  return request<Api.Farm.ActivitySnapshot>({ url: '/farm/activity/solar-terms/claim', method: 'post', data });
}

export function fetchClaimFarmActivityTask(data: Api.Farm.ActivityClaimParams) {
  return request({ url: '/farm/activity/task/claim', method: 'post', data });
}

export function fetchClaimFarmActivityGift(data: Api.Farm.ActivityClaimParams) {
  return request({ url: '/farm/activity/gift/claim', method: 'post', data });
}

/** ========== Analytics ========== */
export function fetchGetFarmAnalyticsDetail(params?: Api.Farm.AnalyticsSearchParams) {
  return request<Api.Farm.AnalyticsDetail>({
    url: '/farm/analytics/detail',
    method: 'get',
    params
  });
}

/** ========== Card ========== */
export function fetchGetFarmCardList(params?: Api.Farm.CardSearchParams) {
  return request<Api.Farm.CardList>({
    url: '/farm/card/list',
    method: 'get',
    params
  });
}

export function fetchAddFarmCard(data: Api.Farm.CardCreateParams) {
  return request({ url: '/farm/card/add', method: 'post', data });
}

export function fetchRedeemFarmCard(data: Api.Farm.CardRedeemParams) {
  return request({ url: '/farm/card/redeem', method: 'post', data });
}

/** ========== Game Config Catalog ========== */
export function fetchGetFarmGameConfigSeeds() {
  return request<Api.Farm.GameConfigSeed[]>({
    url: '/farm/game-config/seeds',
    method: 'get'
  });
}

export function fetchGetFarmGameConfigFruits() {
  return request<Api.Farm.GameConfigFruit[]>({
    url: '/farm/game-config/fruits',
    method: 'get'
  });
}

export function fetchGetFarmGameConfigItems(params?: { type?: number }) {
  return request<Api.Farm.GameConfigItem[]>({
    url: '/farm/game-config/items',
    method: 'get',
    params
  });
}

export function fetchGetFarmGameConfigPlants() {
  return request<Api.Farm.GameConfigPlant[]>({
    url: '/farm/game-config/plants',
    method: 'get'
  });
}

export function fetchGetFarmGameConfigItemTypes() {
  return request<Api.Farm.GameConfigItemType[]>({
    url: '/farm/game-config/item-types',
    method: 'get'
  });
}

export function fetchAddFarmGameConfigSeed(data: Api.Farm.GameConfigSeedWriteParams) {
  return request({ url: '/farm/game-config/seed/add', method: 'post', data });
}

export function fetchModifyFarmGameConfigSeed(data: Api.Farm.GameConfigSeedWriteParams) {
  return request({ url: '/farm/game-config/seed/modify', method: 'post', data });
}

export function fetchDeleteFarmGameConfigSeed(seedId: number) {
  return request({ url: '/farm/game-config/seed/delete', method: 'post', data: { seedId } });
}

export function fetchAddFarmGameConfigFruit(data: Api.Farm.GameConfigFruitWriteParams) {
  return request({ url: '/farm/game-config/fruit/add', method: 'post', data });
}

export function fetchModifyFarmGameConfigFruit(data: Api.Farm.GameConfigFruitWriteParams) {
  return request({ url: '/farm/game-config/fruit/modify', method: 'post', data });
}

export function fetchDeleteFarmGameConfigFruit(id: number) {
  return request({ url: '/farm/game-config/fruit/delete', method: 'post', data: { id } });
}

export function fetchAddFarmGameConfigItem(data: Api.Farm.GameConfigItemWriteParams) {
  return request({ url: '/farm/game-config/item/add', method: 'post', data });
}

export function fetchModifyFarmGameConfigItem(data: Api.Farm.GameConfigItemWriteParams) {
  return request({ url: '/farm/game-config/item/modify', method: 'post', data });
}

export function fetchDeleteFarmGameConfigItem(id: number) {
  return request({ url: '/farm/game-config/item/delete', method: 'post', data: { id } });
}
