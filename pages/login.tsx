import { NextPage } from "next"
import { useContext, useState } from "react"
import { AppContext } from "@/context/AppContext"
import { useRouter } from "next/router"
import { login } from "@/lib/auth"

const Login : NextPage = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("UserProfile must be used within an AppProvider")
  }
  const { setUsername } = appContext
  const router = useRouter()

  const [data, setData] = useState({ identifier : "", password : "" })

  const handleLogin = async () => {
    try {
      const res = await login(data.identifier, data.password)
      setUsername(res.data.user.username)
      await router.push("/")
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <>
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
    </>
  )
}

export default Login
