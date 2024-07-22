import React, { createContext, useState, useEffect, ReactNode } from "react"

type AppContextType = {
  username : string | null;
  setUsername : (username : string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined)

const AppProvider = ({ children } : { children : ReactNode }) => {
  const [username, setUsername] = useState<string>(null)

  useEffect(() => {
    const storedUsername = localStorage.getItem("username")
    if (storedUsername) {
      setUsername(storedUsername)
    }
  }, [])

  const loadUsername = (username : string) => {
    localStorage.setItem("username", username)
    setUsername(username)
  }

  return (
    <AppContext.Provider value={{ username, setUsername : loadUsername }}>
      {children}
    </AppContext.Provider>
  )
}

export { AppContext, AppProvider }