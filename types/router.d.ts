import type { RouteRecordRaw } from 'vue-router'

interface IShortClipRouteMeta {
  roles?: string[]
  sort?: number
  showMenu?: boolean
  icon?: string
  title?: string
}

type IShortClipRoute = RouteRecordRaw & {
  meta?: IShortClipRouteMeta
}

declare global {
  type ShortClipRoute = IShortClipRoute | IShortClipRoute[]
  type ShortClipRouteRecord = IShortClipRoute & {
    meta: {
      isTop?: boolean | undefined
    }
  }
}
