import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import { getMe, login as loginRequest, register as registerRequest } from '../api'
import type { User } from '../types'
import { AuthContext } from './context'

const TOKEN_KEY = 'absolute-cinema-token'

type AuthProviderProps = {
  children: ReactNode
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<User | null>(null)
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(TOKEN_KEY),
  )
  const [loading, setLoading] = useState(
    () => Boolean(localStorage.getItem(TOKEN_KEY)),
  )

  const logout = useCallback(() => {
    localStorage.removeItem(TOKEN_KEY)
    setToken(null)
    setUser(null)
    setLoading(false)
  }, [])

  useEffect(() => {
    const onUnauthorized = () => logout()
    window.addEventListener('absolute-cinema:unauthorized', onUnauthorized)
    return () => {
      window.removeEventListener('absolute-cinema:unauthorized', onUnauthorized)
    }
  }, [logout])

  useEffect(() => {
    let active = true
    const storedToken = localStorage.getItem(TOKEN_KEY)
    if (!storedToken) {
      return () => {
        active = false
      }
    }

    void getMe()
      .then((currentUser) => {
        if (active) {
          setUser(currentUser)
          setToken(storedToken)
        }
      })
      .catch(() => {
        if (active) {
          logout()
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false)
        }
      })
    return () => {
      active = false
    }
  }, [logout])

  const login = useCallback(async (email: string, password: string) => {
    const result = await loginRequest(email, password)
    localStorage.setItem(TOKEN_KEY, result.access_token)
    setToken(result.access_token)
    try {
      setUser(await getMe())
    } catch (error) {
      localStorage.removeItem(TOKEN_KEY)
      setToken(null)
      throw error
    }
  }, [])

  const register = useCallback(async (
    email: string,
    username: string,
    password: string,
  ) => {
    await registerRequest(email, username, password)
    await login(email, password)
  }, [login])

  const value = useMemo(
    () => ({ user, token, loading, login, register, logout }),
    [user, token, loading, login, register, logout],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
