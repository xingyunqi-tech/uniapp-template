/** 回到页面时是否需要重新拉取消息：发出后未取得回答 id 就被中断，或最后一条仍是本地发送的消息 */
export function shouldReloadOnShow(
  messages: readonly { local?: boolean }[],
  interruptedWhileSending: boolean,
): boolean {
  return interruptedWhileSending || messages[messages.length - 1]?.local === true;
}
