'use client'

import { schemas, unwrap } from '@polar-sh/client'
import React from 'react'
import { api } from '@/utils/client'

export type AuthContextValue = {
  user?: schemas['UserRead']
  userOrganizations: schemas['Organization'][]
  setUser: React.Dispatch<React.SetStateAction<schemas['UserRead']>>
  setUserOrganizations: React.Dispatch<
    React.SetStateAction<schemas['Organization'][]>
  >
}

const stub = (): never => {
  throw new Error('You forgot to wrap your component in <UserContextProvider>.')
}

export const AuthContext = React.createContext<AuthContextValue>(
  // @ts-ignore
  stub,
)

export const UserContextProvider = ({
  user: _user,
  userOrganizations: _userOrganizations,
  children,
}: {
  user: schemas['UserRead'] | undefined
  userOrganizations: schemas['Organization'][]
  children: React.ReactNode
}) => {
  const [user, setUser] = React.useState<schemas['UserRead'] | undefined>(_user)
  const [userOrganizations, setUserOrganizations] =
    React.useState<schemas['Organization'][]>(_userOrganizations)

  React.useEffect(() => {
    if (user !== undefined) {
      return
    }

    // In environments where the auth middleware is disabled and
    // therefore didn't pre-populate the user from `x-polar-user`,
    // try to hydrate it from the API using the session cookie.
    const loadUser = async () => {
      try {
        const loadedUser = await unwrap(api.GET('/v1/users/me'))
        setUser(loadedUser)
      } catch {
        // Ignore errors (e.g. 401 when unauthenticated) and keep user undefined.
      }
    }

    void loadUser()
  }, [user])

  const contextValue = React.useMemo(
    () => ({
      user,
      setUser: setUser as React.Dispatch<
        React.SetStateAction<schemas['UserRead']>
      >,
      userOrganizations,
      setUserOrganizations,
    }),
    [user, userOrganizations, setUser, setUserOrganizations],
  )

  return (
    <AuthContext.Provider value={contextValue}>{children}</AuthContext.Provider>
  )
}
