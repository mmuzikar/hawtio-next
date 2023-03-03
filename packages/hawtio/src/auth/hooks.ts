import { useEffect, useState } from 'react'
import { userService } from './user-service'

/**
 * Custom React hook for using Hawtio plugins.
 */
export function useUser() {
  const [username, setUsername] = useState('')
  const [isLogin, setIsLogin] = useState(false)
  const [userLoaded, setUserLoaded] = useState(false)

  useEffect(() => {
    const fetchUser = async () => {
      const username = await userService.getUsername()
      const isLogin = await userService.isLogin()
      setUsername(username)
      setIsLogin(isLogin)
      setUserLoaded(true)
    }
    fetchUser()
  }, [])

  return { username, isLogin, userLoaded }
}