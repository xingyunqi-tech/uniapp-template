import { describe, expect, it } from 'vitest';
import { ConsentType } from '@/api';
import { DEFAULT_AGREEMENT_CONTENT } from '@/constants/agreement';

const ALIYUN_MODERATION = '阿里云内容安全：对提问与回答文本进行内容安全审核，会提供用户 ID 与消息 ID';

describe('内置协议正文', () => {
  it('AI 服务声明说明阿里云内容安全审核', () => {
    expect(DEFAULT_AGREEMENT_CONTENT[ConsentType.AI_SERVICE]).toContain(ALIYUN_MODERATION);
  });

  it('隐私政策的共享情形包含阿里云内容安全审核', () => {
    const privacy = DEFAULT_AGREEMENT_CONTENT[ConsentType.PRIVACY_POLICY];
    const sharing = privacy.slice(privacy.indexOf('<h4>2.1 共享</h4>'), privacy.indexOf('<h4>2.2 转让</h4>'));

    expect(sharing).toContain(ALIYUN_MODERATION);
  });
});
