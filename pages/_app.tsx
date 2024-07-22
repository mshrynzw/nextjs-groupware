import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import Layout from "@/components/layout"
import { AppContext, AppProvider } from "@/context/AppContext"

export default function App({ Component, pageProps } : AppProps) {
  const [user, setUser] = useState(null)

  useEffect(() => {
    const token = Cookies.get("token")
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        headers : {
          Authorization : `Bearer ${token}`
        }
      }).then(async (res) => {
        if (!res.ok) {
          Cookies.remove("token")
          setUser(null)
          return null
        }
        const user = await res.json()
        setUser(user)
      })
    }
  }, [])

  return (
    <AppProvider value={{ user : user, setUser : setUser }}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppProvider>
  )
}