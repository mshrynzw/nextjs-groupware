import React, { createContext, useState, useEffect, ReactNode } from "react"
import { User } from "@/types/user"

type AppContextType = {
  user : User | null;
  setUser : (user : User | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const AppProvider = ({ children } : { children : ReactNode }) => {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const storedUser = localStorage.getItem("user")
    if (storedUser) {
      setUser(JSON.parse(storedUser))
    }
  }, [])

  const loadUser = (user : User) => {
    localStorage.setItem("user", JSON.stringify(user))
    setUser(user)
  }

  return (
    <AppContext.Provider value={{ user, setUser : loadUser }}>
      {children}
    </AppContext.Provider>
  )
}

export { AppContext, AppProvider }
