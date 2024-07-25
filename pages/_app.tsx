import "@/styles/globals.css"
import type { AppProps } from "next/app"
import { useState, useEffect } from "react"
import Cookies from "js-cookie"
import Layout from "@/components/layout"
import { AppProvider } from "@/context/AppContext"
import { useRouter } from "next/router"
import { User } from "@/types/user"
import client from "@/lib/apollo"
import { ApolloProvider } from "@apollo/client"

const App = ({ Component, pageProps } : AppProps) => {
  const [user, setUser] = useState<User | null>(null)
  useEffect(() => {
    const token = Cookies.get("token")
    if (token) {
      fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users/me`, {
        headers : {
          Authorization : `Bearer ${token}`
        }
      }).then(async (response) => {
        if (!response.ok) {
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

    if (router.pathname === "/login") {
      Cookies.remove("token")
      setUser(null)
    }
  }, [router])

  return (
    <AppProvider value={{ user, setUser }}>
      <ApolloProvider client={client}>
        <Layout>
          <Component {...pageProps} />
        </Layout>
      </ApolloProvider>
    </AppProvider>
  )
}

export default App
