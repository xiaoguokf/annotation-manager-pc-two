declare module 'solarlunar' {
  export interface LunarResult {
    date: Date
    lYear: number
    lMonth: number // 1-12，闰月为负
    lDay: number
    isLeap: boolean
    lMonthCn: string
    lDayCn: string
    gzYear: string
    gzMonth: string
    gzDay: string
    animal: string
    term: string | null
    festival: string | null
    solarFestival: string | null
    week: number
    weekCn: string
    isToday: boolean
  }

  const solarLunar: {
    solar2lunar(year: number, month: number, day: number): LunarResult
    lunar2solar(year: number, month: number, day: number, isLeap?: boolean): {
      date: Date
      cYear: number
      cMonth: number
      cDay: number
    }
    getDaysOfMonth(year: number, month: number): number
    getMonths(year: number): number[]
  }

  export default solarLunar
}
