import { api } from './api'

export interface User {
  id: string
  phone: string
  firstName?: string
  lastName?: string
  role: string
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export const authService = {
  async register(data: {
    phone: string
    password: string
    firstName?: string
    lastName?: string
  }) {
    const response = await api.post<AuthResponse>('/auth/register', data)
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
    }
    return response.data
  },

  async login(phone: string, password?: string) {
    const response = await api.post<AuthResponse & { requiresPasswordSetup?: boolean }>('/auth/login', {
      phone,
      password: password || '',
    })
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
    }
    return response.data
  },

  async setPassword(password: string, confirmPassword: string) {
    const response = await api.post<AuthResponse>('/auth/set-password', {
      password,
      confirmPassword,
    })
    if (response.data.accessToken) {
      localStorage.setItem('accessToken', response.data.accessToken)
      localStorage.setItem('refreshToken', response.data.refreshToken)
    }
    return response.data
  },

  async logout() {
    const refreshToken = localStorage.getItem('refreshToken')
    if (refreshToken) {
      try {
        await api.post('/auth/logout', { refreshToken })
      } catch (error) {
        console.error('Logout error:', error)
      }
    }
    localStorage.removeItem('accessToken')
    localStorage.removeItem('refreshToken')
  },

  getToken(): string | null {
    if (typeof window === 'undefined') return null
    return localStorage.getItem('accessToken')
  },

  isAuthenticated(): boolean {
    return !!this.getToken()
  },
}
