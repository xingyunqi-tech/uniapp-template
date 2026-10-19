import { ConsentType } from '@/api';

/** 各协议当前版本对应的远程配置 key */
export const CONSENT_VERSION_CONFIG_KEYS: Readonly<Record<ConsentType, string>> = {
  [ConsentType.PRIVACY_POLICY]: 'consent.privacyPolicyVersion',
  [ConsentType.USER_AGREEMENT]: 'consent.userAgreementVersion',
  [ConsentType.AI_SERVICE]: 'consent.aiServiceVersion',
};

/** 各协议正文（HTML）对应的远程配置 key */
export const AGREEMENT_CONTENT_CONFIG_KEYS: Readonly<Record<ConsentType, string>> = {
  [ConsentType.PRIVACY_POLICY]: 'agreement.privacyPolicy',
  [ConsentType.USER_AGREEMENT]: 'agreement.userAgreement',
  [ConsentType.AI_SERVICE]: 'agreement.aiService',
};

/** 启动时须同意的协议 */
export const LAUNCH_CONSENT_TYPES: readonly ConsentType[] = [ConsentType.USER_AGREEMENT, ConsentType.PRIVACY_POLICY];

/**
 * 启动时预加载的远程配置 key，按业务调整（后端需将对应配置设为公开）
 */
export const PRELOAD_CONFIG_KEYS: readonly string[] = [
  'app.notice',
  'app.minVersion',
  ...Object.values(CONSENT_VERSION_CONFIG_KEYS),
];
