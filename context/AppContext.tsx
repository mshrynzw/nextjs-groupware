import React, { createContext, useState, useEffect, ReactNode } from "react"

type AppContextType = {
  username : string;
  setUsername : (username : string) => void;
};

const AppContext = createContext<AppContextType | undefined>(undefined)

const AppProvider = ({ children } : { children : ReactNode }) => {
  const [username, setUsernameState] = useState<string>("")

  useEffect(() => {
    const storedUsername = localStorage.getItem('username');
    if (storedUsername) {
      setUsernameState(storedUsername);
    }
  }, []);

  const setUsername = (username: string) => {
    localStorage.setItem('username', username);
    setUsernameState(username);
  };

  return (
    <AppContext.Provider value={{ username, setUsername }}>
      {children}
    </AppContext.Provider>
  )
}

export { AppContext, AppProvider }