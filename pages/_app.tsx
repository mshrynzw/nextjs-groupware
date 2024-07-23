import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import Layout from "@/components/layout"
import { AppProvider } from "@/context/AppContext"
import { useRouter } from "next/router"

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
        if (res.ok) {
          const user = await res.json()
          setUser(user)
        } else {
          Cookies.remove("token")
          setUser(null)
        }
      })
    }
  }, [])

  const router = useRouter()
  useEffect(() => {
    const token = Cookies.get("token")
    if (!token && router.pathname !== "/login" && router.pathname !== "/signup") {
      router.push("/login")
    }

    if (router.pathname === "/login"){
      Cookies.remove("token")
      setUser(null)
    }
  }, [router])

  return (
    <AppProvider value={{ user : user, setUser : setUser }}>
      <Layout>
        <Component {...pageProps} />
      </Layout>
    </AppProvider>
  )
}