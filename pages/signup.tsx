import { NextPage } from "next"
import { useContext, useState } from "react"
import { useRouter } from "next/router"
import { signUp } from "@/lib/auth"
import { AppContext } from "@/context/AppContext"

const SignUp : NextPage = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("UserProfile must be used within an AppProvider")
  }
  const { setUsername } = appContext
  const router = useRouter()

  const [data, setData] = useState({ username : "", email : "", password : "" })
  const [error, setError] = useState("")
  const handleSignUp = async () => {
    try {
      const res = await signUp(data.username, data.email, data.password)
      setUsername(res.data.user.username)
      await router.push("/")
    } catch (err) {
      setError(err.response.data.error.message)
      console.log(err.response.data.error.message)
    }
  }

  return (
    <>
      <h1>Sign Up</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleSignUp() // Await the handleSubmit function
        }}
      >
        <label htmlFor="username">Name</label>
        <input
          type="text"
          name="username"
          id="username"
          autoComplete="username"
          onChange={(e) => setData({ ...data, username : e.target.value })}
        />
        <label htmlFor="email">Email</label>
        <input
          type="email"
          name="email"
          id="email"
          autoComplete="email"
          onChange={(e) => setData({ ...data, email : e.target.value })}
        />
        <label htmlFor="password">Password</label>
        <input
          type="password"
          name="password"
          id="password"
          autoComplete="current-password"
          onChange={(e) => setData({ ...data, password : e.target.value })}
        />
        <button type="submit">Sign Up</button>
      </form>
      {error ? (
        <p>{error}</p>
      ) : null}
    </>
  )
}

export default SignUp