/**
 * 省市区数据
 * 用于 H5 平台的地区选择器
 * 小程序平台使用原生 picker mode="region"
 */

export interface RegionItem {
  value: string;
  text: string;
  children?: RegionItem[];
}

/**
 * 精简版省市区数据（示例数据）
 * 实际项目中建议：
 * 1. 从 https://github.com/modood/Administrative-divisions-of-China 获取完整数据
 * 2. 或使用 uniCloud 的 opendb-city-china 云端数据
 */
export const regionData: RegionItem[] = [
  {
    value: '北京市',
    text: '北京市',
    children: [
      {
        value: '北京市',
        text: '北京市',
        children: [
          { value: '东城区', text: '东城区' },
          { value: '西城区', text: '西城区' },
          { value: '朝阳区', text: '朝阳区' },
          { value: '丰台区', text: '丰台区' },
          { value: '石景山区', text: '石景山区' },
          { value: '海淀区', text: '海淀区' },
          { value: '门头沟区', text: '门头沟区' },
          { value: '房山区', text: '房山区' },
          { value: '通州区', text: '通州区' },
          { value: '顺义区', text: '顺义区' },
          { value: '昌平区', text: '昌平区' },
          { value: '大兴区', text: '大兴区' },
          { value: '怀柔区', text: '怀柔区' },
          { value: '平谷区', text: '平谷区' },
          { value: '密云区', text: '密云区' },
          { value: '延庆区', text: '延庆区' },
        ],
      },
    ],
  },
  {
    value: '上海市',
    text: '上海市',
    children: [
      {
        value: '上海市',
        text: '上海市',
        children: [
          { value: '黄浦区', text: '黄浦区' },
          { value: '徐汇区', text: '徐汇区' },
          { value: '长宁区', text: '长宁区' },
          { value: '静安区', text: '静安区' },
          { value: '普陀区', text: '普陀区' },
          { value: '虹口区', text: '虹口区' },
          { value: '杨浦区', text: '杨浦区' },
          { value: '闵行区', text: '闵行区' },
          { value: '宝山区', text: '宝山区' },
          { value: '嘉定区', text: '嘉定区' },
          { value: '浦东新区', text: '浦东新区' },
          { value: '金山区', text: '金山区' },
          { value: '松江区', text: '松江区' },
          { value: '青浦区', text: '青浦区' },
          { value: '奉贤区', text: '奉贤区' },
          { value: '崇明区', text: '崇明区' },
        ],
      },
    ],
  },
  {
    value: '广东省',
    text: '广东省',
    children: [
      {
        value: '广州市',
        text: '广州市',
        children: [
          { value: '越秀区', text: '越秀区' },
          { value: '海珠区', text: '海珠区' },
          { value: '荔湾区', text: '荔湾区' },
          { value: '天河区', text: '天河区' },
          { value: '白云区', text: '白云区' },
          { value: '黄埔区', text: '黄埔区' },
          { value: '番禺区', text: '番禺区' },
          { value: '花都区', text: '花都区' },
          { value: '南沙区', text: '南沙区' },
          { value: '从化区', text: '从化区' },
          { value: '增城区', text: '增城区' },
        ],
      },
      {
        value: '深圳市',
        text: '深圳市',
        children: [
          { value: '罗湖区', text: '罗湖区' },
          { value: '福田区', text: '福田区' },
          { value: '南山区', text: '南山区' },
          { value: '宝安区', text: '宝安区' },
          { value: '龙岗区', text: '龙岗区' },
          { value: '盐田区', text: '盐田区' },
          { value: '龙华区', text: '龙华区' },
          { value: '坪山区', text: '坪山区' },
          { value: '光明区', text: '光明区' },
        ],
      },
      {
        value: '珠海市',
        text: '珠海市',
        children: [
          { value: '香洲区', text: '香洲区' },
          { value: '斗门区', text: '斗门区' },
          { value: '金湾区', text: '金湾区' },
        ],
      },
      {
        value: '东莞市',
        text: '东莞市',
        children: [{ value: '东莞市', text: '东莞市' }],
      },
      {
        value: '佛山市',
        text: '佛山市',
        children: [
          { value: '禅城区', text: '禅城区' },
          { value: '南海区', text: '南海区' },
          { value: '顺德区', text: '顺德区' },
          { value: '三水区', text: '三水区' },
          { value: '高明区', text: '高明区' },
        ],
      },
    ],
  },
  {
    value: '浙江省',
    text: '浙江省',
    children: [
      {
        value: '杭州市',
        text: '杭州市',
        children: [
          { value: '上城区', text: '上城区' },
          { value: '拱墅区', text: '拱墅区' },
          { value: '西湖区', text: '西湖区' },
          { value: '滨江区', text: '滨江区' },
          { value: '萧山区', text: '萧山区' },
          { value: '余杭区', text: '余杭区' },
          { value: '临平区', text: '临平区' },
          { value: '钱塘区', text: '钱塘区' },
          { value: '富阳区', text: '富阳区' },
          { value: '临安区', text: '临安区' },
        ],
      },
      {
        value: '宁波市',
        text: '宁波市',
        children: [
          { value: '海曙区', text: '海曙区' },
          { value: '江北区', text: '江北区' },
          { value: '北仑区', text: '北仑区' },
          { value: '镇海区', text: '镇海区' },
          { value: '鄞州区', text: '鄞州区' },
          { value: '奉化区', text: '奉化区' },
        ],
      },
    ],
  },
  {
    value: '江苏省',
    text: '江苏省',
    children: [
      {
        value: '南京市',
        text: '南京市',
        children: [
          { value: '玄武区', text: '玄武区' },
          { value: '秦淮区', text: '秦淮区' },
          { value: '建邺区', text: '建邺区' },
          { value: '鼓楼区', text: '鼓楼区' },
          { value: '浦口区', text: '浦口区' },
          { value: '栖霞区', text: '栖霞区' },
          { value: '雨花台区', text: '雨花台区' },
          { value: '江宁区', text: '江宁区' },
          { value: '六合区', text: '六合区' },
          { value: '溧水区', text: '溧水区' },
          { value: '高淳区', text: '高淳区' },
        ],
      },
      {
        value: '苏州市',
        text: '苏州市',
        children: [
          { value: '虎丘区', text: '虎丘区' },
          { value: '吴中区', text: '吴中区' },
          { value: '相城区', text: '相城区' },
          { value: '姑苏区', text: '姑苏区' },
          { value: '吴江区', text: '吴江区' },
          { value: '苏州工业园区', text: '苏州工业园区' },
        ],
      },
    ],
  },
];
