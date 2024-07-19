import React, { createContext, useState, ReactNode } from "react"

type AppContextType = {
  username : string;
  setUsername : (username : string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined)

const AppProvider = ({ children } : { children : ReactNode }) => {
  const [username, setUsername] = useState<string>("")

  return (
    <AppContext.Provider value={{ username, setUsername }}>
      {children}
    </AppContext.Provider>
  )
}

export { AppContext, AppProvider }