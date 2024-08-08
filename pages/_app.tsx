import "@/styles/globals.css"
import type { AppProps } from "next/app"
import Router from "next/router"
import { useState, useEffect } from "react"
import { createRoot, Root } from "react-dom/client"
import Cookies from "js-cookie"
import Layout from "@/components/Layout"
import { AppProvider } from "@/context/AppContext"
import { useRouter } from "next/router"
import { User } from "@/types/user"
import client from "@/lib/apollo"
import { ApolloProvider } from "@apollo/client"
import PageChange from "@/components/PageChange"

let root: Root | null = null

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

  useEffect(() => {
    const pageTransitionElement = document.getElementById('page-transition')

    const handleRouteChangeStart = () => {
      document.body.classList.add("body-page-transition")
      
      if (pageTransitionElement) {
        if (!root) {
          root = createRoot(pageTransitionElement)
        }
        root.render(<PageChange />)
      }
    }

    const handleRouteChangeComplete = () => {
      document.body.classList.remove("body-page-transition")
      if (root) {
        root.unmount()
        root = null
      }
    }

    const handleRouteChangeError = () => {
      document.body.classList.remove("body-page-transition")
      if (root) {
        root.unmount()
        root = null
      }
    }

    Router.events.on('routeChangeStart', handleRouteChangeStart)
    Router.events.on("routeChangeComplete", handleRouteChangeComplete)
    Router.events.on("routeChangeError", handleRouteChangeError)

    return () => {
      Router.events.off('routeChangeStart', handleRouteChangeStart)
      Router.events.off("routeChangeComplete", handleRouteChangeComplete)
      Router.events.off("routeChangeError", handleRouteChangeError)
    }
  }, [])

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