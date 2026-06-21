import dayjs from 'dayjs'
import solarLunar from 'solarlunar'

/**
 * 节日信息
 */
export interface FestivalInfo {
  /** 节日名称，如「春节」「元旦」 */
  name: string
  /** 祝福语，如「春节快乐」「端午安康」 */
  greeting: string
  /** 节日介绍，温馨文案 */
  description: string
  /** 来源类型：公历 / 农历 */
  type: 'solar' | 'lunar'
  /** 优先级：数字越大越优先；同日多节日时按此排序，低优先级会被收缩 */
  priority: number
}

interface FestivalDef {
  name: string
  greeting: string
  description: string
  priority: number
}

/* 优先级约定：
 *  100 除夕、春节           —— 一年中最重节日
 *  90  端午、中秋、元宵      —— 三大传统节日
 *  85  国庆                 —— 法定长假
 *  80  元旦、劳动节          —— 法定假日
 *  75  母亲节、父亲节         —— 温情节日
 *  70  重阳、七夕、腊八、龙抬头、中元、小年 —— 传统节日
 *  65  教师节、建军节、建党节、青年节、妇女节、植树节 —— 纪念节日
 *  60  情人节、圣诞节、愚人节、儿童节、双十一 —— 商业/趣味节日
 */

// 公历固定节日表（MM-DD）
const SOLAR_FESTIVALS: Record<string, FestivalDef> = {
  '01-01': {
    name: '元旦', greeting: '元旦快乐', priority: 80,
    description: '辞旧迎新，万象更新。愿新的一年，所求皆所愿，所行化坦途。',
  },
  '02-14': {
    name: '情人节', greeting: '情人节快乐', priority: 60,
    description: '愿有岁月可回首，且以深情共白头。今天，记得对在乎的人说一句「我喜欢你」。',
  },
  '03-08': {
    name: '妇女节', greeting: '妇女节快乐', priority: 65,
    description: '致敬每一位温柔而坚定的她。愿你眼里有光，心中有梦，活成自己喜欢的模样。',
  },
  '03-12': {
    name: '植树节', greeting: '植树节快乐', priority: 65,
    description: '种下一棵树，收获一片绿。今天你种的每一棵树，都是写给未来的情书。',
  },
  '04-01': {
    name: '愚人节', greeting: '愚人节快乐', priority: 60,
    description: '今天说谎话可以被原谅，但真心话也请认真听。',
  },
  '05-01': {
    name: '劳动节', greeting: '劳动节快乐', priority: 80,
    description: '所有认真生活的人都值得被尊敬。今天，给辛苦了一段时间的自己一个拥抱。',
  },
  '05-04': {
    name: '青年节', greeting: '青年节快乐', priority: 65,
    description: '愿你历尽千帆，归来仍是少年。青春不止一段年龄，更是一种心境。',
  },
  '06-01': {
    name: '儿童节', greeting: '儿童节快乐', priority: 60,
    description: '愿你保留一份童真，对世界依然充满好奇。今天，做回那个简单快乐的小孩。',
  },
  '07-01': {
    name: '建党节', greeting: '建党节快乐', priority: 65,
    description: '不忘初心，方得始终。愿我们都在自己的岗位上发光发热。',
  },
  '08-01': {
    name: '建军节', greeting: '建军节快乐', priority: 65,
    description: '致敬最可爱的人，山河无恙，因为有你们负重前行。',
  },
  '09-10': {
    name: '教师节', greeting: '教师节快乐', priority: 65,
    description: '三尺讲台，桃李满天下。感谢每一位引路人，让我们成为更好的自己。',
  },
  '10-01': {
    name: '国庆节', greeting: '国庆节快乐', priority: 85,
    description: '愿山河锦绣，国泰民安。祝福祖国，也祝福每一个努力生活的你。',
  },
  '11-11': {
    name: '双十一', greeting: '双十一快乐', priority: 60,
    description: '购物车里装的是生活，订单里藏的是期待。理性消费，也要善待自己。',
  },
  '12-25': {
    name: '圣诞节', greeting: '圣诞节快乐', priority: 60,
    description: '窗外飘着雪，屋里有暖光。愿你被这个世界温柔以待，全年都有圣诞般的惊喜。',
  },
}

// 农历固定节日表（农历 MM-DD，闰月不算）
const LUNAR_FESTIVALS: Record<string, FestivalDef> = {
  '01-01': {
    name: '春节', greeting: '春节快乐', priority: 100,
    description: '爆竹声中一岁除，春风送暖入屠苏。万家灯火里，藏着最暖的团圆。愿新的一年，喜乐安康，万事顺意。',
  },
  '01-15': {
    name: '元宵节', greeting: '元宵节快乐', priority: 90,
    description: '月圆人圆事事圆，花好景好年年好。一碗汤圆，甜的是团圆，暖的是人心。',
  },
  '02-02': {
    name: '龙抬头', greeting: '龙抬头快乐', priority: 70,
    description: '二月二，龙抬头，万物生发好兆头。愿一年都有向上的力量，蒸蒸日上。',
  },
  '05-05': {
    name: '端午节', greeting: '端午安康', priority: 90,
    description: '粽叶飘香，艾草悬门。一江粽香里，藏着千年的思念。愿所爱之人，岁岁安康。',
  },
  '07-07': {
    name: '七夕节', greeting: '七夕快乐', priority: 70,
    description: '金风玉露一相逢，便胜却人间无数。愿有情人终成眷属，愿每份深情都不被辜负。',
  },
  '07-15': {
    name: '中元节', greeting: '中元节安康', priority: 70,
    description: '一盏河灯，一份思念。愿故人安息，生者珍惜眼前人。',
  },
  '08-15': {
    name: '中秋节', greeting: '中秋快乐', priority: 90,
    description: '但愿人长久，千里共婵娟。今夜，无论身在何处，我们仰望的是同一轮明月。',
  },
  '09-09': {
    name: '重阳节', greeting: '重阳节快乐', priority: 70,
    description: '独在异乡为异客，每逢佳节倍思亲。今天，记得给远方的家人打个电话。',
  },
  '12-08': {
    name: '腊八节', greeting: '腊八节快乐', priority: 70,
    description: '过了腊八就是年，一锅粥熬出的是家的味道。愿你暖在胃里，更暖在心头。',
  },
  '12-23': {
    name: '小年', greeting: '小年快乐', priority: 70,
    description: '辞旧迎新从小年开始，扫去一年的尘埃，迎接新年的喜庆。',
  },
  '12-24': {
    name: '小年', greeting: '小年快乐', priority: 70,
    description: '辞旧迎新从小年开始，扫去一年的尘埃，迎接新年的喜庆。',
  },
}

// 除夕单独定义（农历腊月最后一天，可能 29 或 30）
const NEW_YEARS_EVE: FestivalDef = {
  name: '除夕', greeting: '除夕快乐', priority: 100,
  description: '一夜连双岁，五更分二年。万家灯火里，是归途，也是新程。愿你阖家团圆，来年可期。',
}

// 变动日期公历节日：通过函数判断是否命中
type SolarDynamicMatcher = (d: dayjs.Dayjs) => FestivalDef | null

/**
 * 计算某年某月第 n 个星期几的日期
 * @param year 年
 * @param month 月 1-12
 * @param weekday 周几 0=周日 1=周一 ...
 * @param n 第几个
 */
const nthWeekdayOfMonth = (year: number, month: number, weekday: number, n: number): dayjs.Dayjs => {
  const first = dayjs(`${year}-${String(month).padStart(2, '0')}-01`)
  const offset = (weekday - first.day() + 7) % 7
  return first.add(offset + (n - 1) * 7, 'day')
}

const SOLAR_DYNAMIC_FESTIVALS: SolarDynamicMatcher[] = [
  // 母亲节：5 月第二个星期日
  (d) => {
    const target = nthWeekdayOfMonth(d.year(), 5, 0, 2)
    if (d.month() === 4 && d.date() === target.date()) {
      return {
        name: '母亲节', greeting: '母亲节快乐', priority: 75,
        description: '世上最温柔的字眼是「妈妈」。今天，记得给她打个电话，说一句「我爱你」。',
      }
    }
    return null
  },
  // 父亲节：6 月第三个星期日
  (d) => {
    const target = nthWeekdayOfMonth(d.year(), 6, 0, 3)
    if (d.month() === 5 && d.date() === target.date()) {
      return {
        name: '父亲节', greeting: '父亲节快乐', priority: 75,
        description: '父爱如山，沉默却深沉。今天，给那个不善言辞的男人一个拥抱。',
      }
    }
    return null
  },
]

const pad2 = (n: number) => String(n).padStart(2, '0')

/**
 * 节日统一服务：根据日期返回今日命中的所有节日，按优先级倒序排列
 *
 * 收集顺序：
 * 1. 除夕（明天是正月初一即今天为除夕）
 * 2. 农历节日（闰月不算）
 * 3. 公历固定节日
 * 4. 公历变动日期节日（母亲节、父亲节）
 *
 * 同日命中多个节日时，priority 高的排在前面；展示层可据 priority 收缩次级节日。
 */
export class FestivalService {
  /**
   * 获取指定日期命中的所有节日，按优先级倒序
   * @param date 日期，默认当天
   */
  static getFestivals(date: Date | string = new Date()): FestivalInfo[] {
    const d = dayjs(date)
    const result: FestivalInfo[] = []

    // 1. 除夕特殊判定：明天是正月初一
    const tomorrow = d.add(1, 'day')
    const tomorrowLunar = solarLunar.solar2lunar(tomorrow.year(), tomorrow.month() + 1, tomorrow.date())
    if (tomorrowLunar.lMonth === 1 && tomorrowLunar.lDay === 1) {
      result.push({ ...NEW_YEARS_EVE, type: 'lunar' })
    }

    // 2. 农历节日（闰月不算，避免闰五月初五误判为端午）
    const lunar = solarLunar.solar2lunar(d.year(), d.month() + 1, d.date())
    if (!lunar.isLeap) {
      const lunarKey = `${pad2(lunar.lMonth)}-${pad2(lunar.lDay)}`
      const lunarFestival = LUNAR_FESTIVALS[lunarKey]
      if (lunarFestival) {
        result.push({ ...lunarFestival, type: 'lunar' })
      }
    }

    // 3. 公历固定节日
    const solarKey = d.format('MM-DD')
    const solarFestival = SOLAR_FESTIVALS[solarKey]
    if (solarFestival) {
      result.push({ ...solarFestival, type: 'solar' })
    }

    // 4. 公历变动日期节日
    for (const matcher of SOLAR_DYNAMIC_FESTIVALS) {
      const def = matcher(d)
      if (def) {
        result.push({ ...def, type: 'solar' })
      }
    }

    // 按 priority 倒序
    return result.sort((a, b) => b.priority - a.priority)
  }

  /**
   * 获取优先级最高的节日（兼容旧接口，返回单个）
   */
  static getFestival(date?: Date | string): FestivalInfo | null {
    const list = this.getFestivals(date)
    return list[0] ?? null
  }

  /**
   * 判断今天是否为节日
   */
  static isFestival(date?: Date | string): boolean {
    return this.getFestivals(date).length > 0
  }

  /**
   * 获取最高优先级节日的祝福语
   */
  static getGreeting(date?: Date | string): string {
    return this.getFestival(date)?.greeting ?? ''
  }

  /**
   * 获取最高优先级节日的名称
   */
  static getName(date?: Date | string): string {
    return this.getFestival(date)?.name ?? ''
  }

  /**
   * 获取最高优先级节日的介绍
   */
  static getDescription(date?: Date | string): string {
    return this.getFestival(date)?.description ?? ''
  }
}

export default FestivalService
