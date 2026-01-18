import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

export const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
})

// Add auth token to requests
api.interceptors.request.use((config) => {
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('accessToken')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
  }
  return config
})

// Handle token refresh and network errors
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    // Handle network errors
    if (!error.response) {
      console.error('Network Error:', {
        message: error.message,
        code: error.code,
        config: error.config,
        apiUrl: API_URL,
      })
      
      // Provide helpful error message
      if (error.code === 'ECONNREFUSED' || error.message.includes('Network Error')) {
        error.message = `Cannot connect to backend server. Make sure it's running on ${API_URL}`
      }
      
      return Promise.reject(error)
    }

    const originalRequest = error.config

    // Handle subscription expired error
    if (error.response?.status === 403 && error.response?.data?.code === 'SUBSCRIPTION_EXPIRED') {
      // Store subscription error info
      if (typeof window !== 'undefined') {
        localStorage.setItem('subscriptionExpired', JSON.stringify({
          message: error.response.data.message || 'انتهت مدة الاشتراك',
          expiredAt: error.response.data.expiredAt,
        }))
        // Redirect to subscription renewal page or show modal
        if (!window.location.pathname.includes('/subscription')) {
          window.location.href = '/dashboard/subscription-expired'
        }
      }
      return Promise.reject(error)
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = localStorage.getItem('refreshToken')
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          })

          const { accessToken, refreshToken: newRefreshToken } = response.data

          localStorage.setItem('accessToken', accessToken)
          if (newRefreshToken) {
            localStorage.setItem('refreshToken', newRefreshToken)
          }

          originalRequest.headers.Authorization = `Bearer ${accessToken}`
          return api(originalRequest)
        }
      } catch (refreshError) {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        window.location.href = '/login'
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  }
)
