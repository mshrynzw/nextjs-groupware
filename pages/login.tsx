import { NextPage } from "next"
import { useContext, useState } from "react"
import { AppContext } from "@/context/AppContext"
import { useRouter } from "next/router"
import { login } from "@/lib/auth"
import Head from "next/head"

const Login : NextPage = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("UserProfile must be used within an AppProvider")
  }
  const { setUser } = appContext
  const router = useRouter()

  const [data, setData] = useState({ identifier : "", password : "" })
  const [error, setError] = useState("")
  const handleLogin = async () => {
    try {
      const response = await login(data.identifier, data.password)
      setUser(response.data.user)
      await router.push("/")
    } catch (err) {
      setError(err.response.data.error.message)
      console.error(err)
    }
  }

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <h1>Login</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleLogin()
        }}
      >
        <label htmlFor="identifier">Email</label>
        <input
          type="email"
          name="identifier"
          id="identifier"
          autoComplete="identifier"
          onChange={(e) => setData({ ...data, identifier : e.target.value })}
        />
        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          autoComplete="current-password"
          onChange={(e) => setData({ ...data, password : e.target.value })}
        />
        <button type="submit">Login</button>
      </form>
      {error ? (
        <p>{error}</p>
      ) : null}
    </>
  )
}

export default Login
