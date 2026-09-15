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
  if (params.authStatus) out.authStatus = params.authStatus;
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
  return request<Api.Farm.Account>({ url: '/farm/account/add', method: 'post', data });
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

export function fetchGetFarmBagSeeds(accountId: number) {
  return request<Api.Farm.BagSeed[]>({
    url: '/farm/bag/seeds',
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

export function fetchUseFarmBag(data: Api.Farm.BagUseParams) {
  return request<Api.Farm.BagUseResult>({
    url: '/farm/bag/use',
    method: 'post',
    data
  });
}

export function fetchGetFarmDailyGifts(accountId: number) {
  return request<Api.Farm.DailyGiftsResponse>({
    url: '/farm/daily-gifts',
    method: 'get',
    params: { accountId }
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

/** ========== 活动中心：公益小红花 / 雨落成诗 / 萌宠成长日记（对齐 rust 桌面端 API 面） ========== */
export function fetchGetFarmActivityCharity(accountId: number) {
  return request<any>({
    url: '/farm/activity/charity',
    method: 'get',
    params: { accountId }
  });
}

export function fetchClaimFarmActivityCharitySeeds(data: { accountId: number }) {
  return request<any>({
    url: '/farm/activity/charity/operate',
    method: 'post',
    data: { accountId: data.accountId, action: 'claimSeeds' }
  });
}

export function fetchDonateFarmActivityCharityLove(data: { accountId: number }) {
  return request<any>({
    url: '/farm/activity/charity/operate',
    method: 'post',
    data: { accountId: data.accountId, action: 'donateLove' }
  });
}

export function fetchClaimFarmActivityCharityDailyGift(data: { accountId: number }) {
  return request<any>({
    url: '/farm/activity/charity/operate',
    method: 'post',
    data: { accountId: data.accountId, action: 'claimDailyGift' }
  });
}

export function fetchClaimFarmActivityCharityProgressReward(data: { accountId: number; target: string }) {
  return request<any>({
    url: '/farm/activity/charity/operate',
    method: 'post',
    data: { accountId: data.accountId, action: 'progressReward', itemId: data.target }
  });
}

export function fetchGetWeatherSnapshot(accountId: number) {
  return request<any>({
    url: '/farm/activity/weather',
    method: 'get',
    params: { accountId }
  });
}

export function fetchScanWeatherFriends(accountId: number, friendGids: string[]) {
  return request<any>({
    url: '/farm/activity/weather/operate',
    method: 'post',
    data: { accountId, action: 'scan', gids: friendGids.map(g => String(g)) }
  });
}

export function fetchExchangeWeatherCollector(accountId: number) {
  return request<any>({
    url: '/farm/activity/weather/operate',
    method: 'post',
    data: { accountId, action: 'exchangeCollector' }
  });
}

export function fetchCollectWeather(accountId: number, friendGid: string) {
  return request<any>({
    url: '/farm/activity/weather/operate',
    method: 'post',
    data: { accountId, action: 'collect', friendGid: String(friendGid) }
  });
}

export function fetchSummonWeather(accountId: number) {
  return request<any>({
    url: '/farm/activity/weather/operate',
    method: 'post',
    data: { accountId, action: 'summon' }
  });
}

export function fetchWeatherMischiefFrog(accountId: number, friendGid: string) {
  return request<any>({
    url: '/farm/activity/weather/operate',
    method: 'post',
    data: { accountId, action: 'frog', friendGid: String(friendGid) }
  });
}

export function fetchWeatherMischiefCloud(accountId: number, friendGid: string, landId?: string) {
  return request<any>({
    url: '/farm/activity/weather/operate',
    method: 'post',
    data: {
      accountId,
      action: 'cloud',
      friendGid: String(friendGid),
      itemId: landId != null && String(landId) !== '' ? String(landId) : undefined
    }
  });
}

export function fetchAdvanceWeatherResearch(accountId: number, nodeId: string) {
  return request<any>({
    url: '/farm/activity/weather/operate',
    method: 'post',
    data: { accountId, action: 'advanceResearch', itemId: String(nodeId) }
  });
}

// 雨落成诗好友基础列表（不进好友农场）：复用好友分页列表并映射为天气视图行。
export async function fetchGetWeatherFriends(accountId: number) {
  const res = await fetchGetFarmFriendList({ current: 1, size: 500, accountId });
  const records = (res.data?.records || []) as Api.Farm.Friend[];
  const rows = records.map(friend => ({
    gid: String(friend.gid ?? ''),
    name: friend.nickname,
    avatarUrl: friend.avatar,
    level: friend.level
  }));
  return { error: res.error, data: rows.filter(row => Number(row.gid) > 0) } as {
    error: typeof res.error;
    data: { gid: string; name?: string; avatarUrl?: string; level?: number }[];
  };
}

export function fetchGetFarmActivityPetDiary(accountId: number) {
  return request<any>({
    url: '/farm/activity/pet-diary',
    method: 'get',
    params: { accountId }
  });
}

// PetDiaryOperateRequest 字段映射：order/charmId/goodsId/nodeId→itemId，gid→friendGid，
// treasureId/challengeId→targetId（对齐 Go PetDiaryOperate 的解析）。
export function fetchOperateFarmActivityPetDiary(accountId: number, action: string, params: Record<string, unknown>) {
  const pick = (...keys: string[]) => {
    for (const key of keys) {
      const value = params[key];
      if (value !== undefined && value !== null && value !== '') return String(value);
    }
    return undefined;
  };
  const count = Number(params.count);
  return request<any>({
    url: '/farm/activity/pet-diary/operate',
    method: 'post',
    data: {
      accountId,
      action,
      itemId: pick('order', 'charmId', 'goodsId', 'nodeId'),
      friendGid: pick('gid', 'friendGid'),
      targetId: pick('treasureId', 'challengeId'),
      count: Number.isFinite(count) && count > 0 ? count : undefined,
      skip: params.skip === true
    }
  });
}

export function fetchGetFarmActivityPetDiaryRecords(accountId: number, kind: 'interact' | 'plunder') {
  return request<any[]>({
    url: '/farm/activity/pet-diary/records',
    method: 'get',
    params: { accountId, kind }
  });
}

export function fetchGetFarmActivityPetDiaryFriend(accountId: number, gid: string) {
  return request<any>({
    url: '/farm/activity/pet-diary/friend',
    method: 'get',
    params: { accountId, gid }
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

export function fetchClaimFarmActivityGreenPlum(data: Api.Farm.ActivityClaimParams) {
  return request<Api.Farm.ActivitySnapshot>({ url: '/farm/activity/green-plum/claim', method: 'post', data });
}

export function fetchStartFarmActivityGreenPlumBrew(data: Api.Farm.ActivityClaimParams) {
  return request<Api.Farm.ActivitySnapshot>({ url: '/farm/activity/green-plum/brew/start', method: 'post', data });
}

export function fetchContinueFarmActivityGreenPlumBrew(data: Api.Farm.ActivityClaimParams) {
  return request<Api.Farm.ActivitySnapshot>({ url: '/farm/activity/green-plum/brew/continue', method: 'post', data });
}

export function fetchSettleFarmActivityGreenPlumBrew(data: Api.Farm.ActivityClaimParams) {
  return request<Api.Farm.ActivitySnapshot>({ url: '/farm/activity/green-plum/brew/settle', method: 'post', data });
}

export function fetchClaimFarmActivityQixiBridge(data: Api.Farm.ActivityClaimParams) {
  return request<Api.Farm.ActivitySnapshot>({ url: '/farm/activity/qixi/bridge/claim', method: 'post', data });
}

export function fetchGiftFarmActivityQixiSachet(data: Api.Farm.ActivityClaimParams) {
  const count = Math.trunc(Number((data as any).sachetCount ?? data.count ?? 0));
  return request<Api.Farm.ActivitySnapshot>({
    url: '/farm/activity/qixi/gift',
    method: 'post',
    data: { ...data, count, sachetCount: count }
  });
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

/** ========== Wx Login ========== */
export function fetchCreateFarmWxLoginTask(appId = 'wx5306c5978fdb76e4') {
  return request<Api.Farm.WxLoginTask>({
    url: '/farm/wx-login/tasks',
    method: 'post',
    data: { app_id: appId }
  });
}

export function fetchFarmWxLoginStatus(taskId: string) {
  return request<Api.Farm.WxLoginTask>({
    url: `/farm/wx-login/tasks/${taskId}/status`,
    method: 'get',
    timeout: 40000
  });
}

export function fetchConfirmFarmWxLogin(taskId: string) {
  return request<Api.Farm.WxLoginTask>({
    url: `/farm/wx-login/tasks/${taskId}/confirm`,
    method: 'post'
  });
}

export function fetchFarmWxLoginCode(taskId: string) {
  return request<Api.Farm.WxLoginCodeResult>({
    url: `/farm/wx-login/tasks/${taskId}/code`,
    method: 'post'
  });
}

export function fetchCreateFarmWxQuickLoginSession() {
  return request<Api.Farm.WxQuickLoginTask>({
    url: '/farm/wx-login/quick-tasks',
    method: 'post'
  });
}

// 本机微信探测/授权由前端浏览器直连 https://localhost.weixin.qq.com:<port>
// （对齐 YYB-Go-Enhanced scan.html；微信本地服务按 TLS 指纹过滤客户端，
// 仅浏览器可通过，后端代理会被直接断开），后端只负责 confirm 换 code。
export function fetchConfirmFarmWxQuickLogin(sessionId: string, redirectUrl: string) {
  return request<Api.Farm.WxLoginCodeResult>({
    url: `/farm/wx-login/quick-tasks/${sessionId}/confirm`,
    method: 'post',
    data: { redirect_url: redirectUrl }
  });
}

/** ========== Commerce ========== */
export function fetchGetFarmGameMall(params: { accountId: number; slotType?: number; subSlotType?: number }) {
  return request<Api.Farm.MallCatalog>({
    url: '/farm/game-mall',
    method: 'get',
    params
  });
}

export function fetchPurchaseFarmGameMall(data: { accountId: number; goodsId: number; count: number }) {
  return request<Api.Farm.MallPurchaseResult>({
    url: '/farm/game-mall/purchase',
    method: 'post',
    data
  });
}

export function fetchGetFarmMysteryShop(accountId: number) {
  return request<Api.Farm.MysteryShop>({
    url: '/farm/mystery-shop',
    method: 'get',
    params: { accountId }
  });
}

export function fetchPurchaseFarmMysteryShop(data: { accountId: number; npcId: number }) {
  return request<Api.Farm.MysteryPurchaseResult>({
    url: '/farm/mystery-shop/purchase',
    method: 'post',
    data
  });
}

export function fetchGetFarmDiamond(accountId: number) {
  return request<Api.Farm.DiamondBalance>({
    url: '/farm/diamond',
    method: 'get',
    params: { accountId }
  });
}

export type SystemConfigPayload = Api.Farm.SystemConfigPayload;

/** ========== 宠物（护主犬）面板 ========== */
export function fetchGetPetInfo(accountId: number) {
  return request<any>({ url: '/farm/pets/dog-info', method: 'get', params: { accountId } });
}

export function fetchPetDeploy(accountId: number, dogId: number) {
  return request<any>({
    url: '/farm/pets/dog-op',
    method: 'post',
    data: { accountId, op: 'deploy', dogId: Number(dogId) }
  });
}

// 宠物激活（bot 9907ffd）：消耗背包宠物卡，把图鉴项变成可上场的已获得宠物
export function fetchPetActivate(accountId: number, dogId: number) {
  return request<any>({
    url: '/farm/pets/dog-op',
    method: 'post',
    data: { accountId, op: 'activate', dogId: Number(dogId) }
  });
}

export function fetchPetWithdraw(accountId: number) {
  return request<any>({ url: '/farm/pets/dog-op', method: 'post', data: { accountId, op: 'withdraw' } });
}

export function fetchPetFoodUse(accountId: number, itemId: number, count: number) {
  return request<any>({
    url: '/farm/pets/dog-op',
    method: 'post',
    data: { accountId, op: 'addFood', itemId: Number(itemId), count: Number(count) }
  });
}

export function fetchGetPetProtectLogs(accountId: number) {
  return request<any>({ url: '/farm/pets/protect-logs', method: 'get', params: { accountId } });
}

// 同气连枝礼包状态：dog-info 的 pendingGiftCount 映射为 rust 面板的 { pending }
export async function fetchGetDogSkillGifts(accountId: number) {
  const res = await fetchGetPetInfo(accountId);
  const pending = Number((res.data as any)?.pendingGiftCount ?? 0);
  return { ...res, data: { pending } };
}

export function fetchClaimDogSkillGifts(accountId: number) {
  return request<any>({
    url: '/farm/pets/dog-op',
    method: 'post',
    data: { accountId, op: 'claimSkillGifts' }
  });
}

/** ========== 图鉴 ========== */
export function fetchGetIllustratedSnapshot(accountId: number) {
  return request<any>({ url: '/farm/illustrated/snapshot', method: 'get', params: { accountId } });
}

/** ========== 互动道具（好友 / 自己农场） ========== */
export function fetchGetFriendInteractionItems(accountId: number) {
  return request<any>({ url: '/farm/friend/interaction-items', method: 'get', params: { accountId } });
}

export function fetchUseFriendInteractionItems(
  accountId: number,
  friendGid: number,
  itemId: number,
  landIds: number[]
) {
  return request<any>({
    url: '/farm/friend/interaction-use',
    method: 'post',
    data: { accountId, friendGid: Number(friendGid), itemId: Number(itemId), landIds: landIds.map(Number) }
  });
}

export function fetchGetFarmInteractionItems(accountId: number) {
  return request<any>({ url: '/farm/interaction-items/self', method: 'get', params: { accountId } });
}

export function fetchUseFarmInteractionItems(accountId: number, itemId: number, landIds: number[]) {
  return request<any>({
    url: '/farm/friend/interaction-use',
    method: 'post',
    data: { accountId, itemId: Number(itemId), landIds: landIds.map(Number) }
  });
}

/** ========== 好友：游戏内删除 ========== */
export function fetchDeleteFarmFriend(accountId: number, gid: number | string) {
  return request<any>({
    url: '/farm/friend/delete',
    method: 'post',
    data: { accountId, gid: String(gid) }
  });
}

/** ========== 设置：化肥立即检测补购 ========== */
export function fetchFertilizerCheckAndBuy(accountId: number) {
  return request<any>({ url: '/farm/fertilizer/check-buy', method: 'post', data: { accountId } });
}

/** ========== 设置：系统配置 ========== */
export function fetchGetSystemConfig() {
  return request<any>({ url: '/farm/system-config', method: 'get' });
}

export function fetchSetSystemConfig(cfg: Api.Farm.SystemConfigPayload) {
  return request<any>({ url: '/farm/system-config/save', method: 'post', data: cfg });
}

export function fetchResetSystemConfig() {
  return request<any>({ url: '/farm/system-config/reset', method: 'post' });
}

export function fetchGetDevicePresets() {
  return request<any[]>({ url: '/farm/system-config/device-presets', method: 'get' });
}

/** ========== 设置：离线提醒 ========== */
export function fetchGetOfflineReminder() {
  return request<Api.Farm.OfflineReminder>({ url: '/farm/offline-reminder', method: 'get' });
}

export function fetchSaveOfflineReminder(cfg: Api.Farm.OfflineReminder) {
  return request<any>({ url: '/farm/offline-reminder/save', method: 'post', data: cfg });
}

export function fetchTestOfflineReminder(cfg: Api.Farm.OfflineReminder) {
  return request<any>({ url: '/farm/offline-reminder/test', method: 'post', data: cfg });
}

/** ========== 设置：QQ 机器人绑定 ========== */
export function fetchGetQqBotBindStatus() {
  return request<any>({ url: '/farm/system/qqbot/bind', method: 'get' });
}

export function fetchStartQqBotBind() {
  return request<any>({ url: '/farm/system/qqbot/bind/start', method: 'post' });
}

export function fetchPollQqBotBind(sessionId: string) {
  return request<any>({ url: '/farm/system/qqbot/bind/poll', method: 'get', params: { sessionId } });
}

export function fetchUnbindQqBot() {
  return request<any>({ url: '/farm/system/qqbot/bind/unbind', method: 'post' });
}
