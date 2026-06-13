import http from '@/utils/http'

interface LoginCmd {
  username: string
  password: string
}

export const login = (logincmd: LoginCmd) => {
  return http.get('/user/info')
}

