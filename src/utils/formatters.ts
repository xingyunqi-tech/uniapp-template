/**
 * 格式化工具函数
 */

/**
 * 格式化文件大小
 * @param bytes 字节数
 * @param decimals 小数位数，默认 2
 * @returns 格式化后的文件大小字符串
 */
export function formatFileSize(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 B';

  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return parseFloat((bytes / Math.pow(k, i)).toFixed(decimals)) + ' ' + sizes[i];
}

/**
 * 格式化数字（千分位）
 * @param num 数字
 * @returns 格式化后的字符串
 */
export function formatNumber(num: number): string {
  return num.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
}

/**
 * 格式化金额
 * @param amount 金额（分）
 * @param decimals 小数位数，默认 2
 * @returns 格式化后的金额字符串
 */
export function formatMoney(amount: number, decimals = 2): string {
  const yuan = amount / 100;
  return yuan.toFixed(decimals);
}

/**
 * 格式化手机号（中间四位隐藏）
 * @param phone 手机号
 * @returns 格式化后的手机号
 */
export function formatPhone(phone: string): string {
  if (!phone || phone.length !== 11) return phone;
  return phone.replace(/(\d{3})\d{4}(\d{4})/, '$1****$2');
}

/**
 * 格式化身份证号（中间隐藏）
 * @param idCard 身份证号
 * @returns 格式化后的身份证号
 */
export function formatIdCard(idCard: string): string {
  if (!idCard || idCard.length < 15) return idCard;
  return idCard.replace(/(\d{4})\d+(\d{4})/, '$1**********$2');
}

/**
 * 格式化银行卡号（只显示后四位）
 * @param cardNo 银行卡号
 * @returns 格式化后的银行卡号
 */
export function formatBankCard(cardNo: string): string {
  if (!cardNo || cardNo.length < 4) return cardNo;
  return '**** **** **** ' + cardNo.slice(-4);
}

/**
 * 截取字符串并添加省略号
 * @param str 字符串
 * @param maxLength 最大长度
 * @returns 截取后的字符串
 */
export function truncate(str: string, maxLength: number): string {
  if (!str || str.length <= maxLength) return str;
  return str.slice(0, maxLength) + '...';
}
