import { NextPage } from "next"
import { useContext, useState } from "react"
import { useRouter } from 'next/router';
import { register } from "@/lib/auth"
import { AppContext } from "@/context/AppContext"

const SignUp : NextPage = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("UserProfile must be used within an AppProvider")
  }
  const { setUsername } = appContext

  const router = useRouter();

  const [data, setData] = useState({ username : "", email : "", password : "" })

  const handleSubmit = async () => {
    try {
      const res = await register(data.username, data.email, data.password)
      setUsername(data.username)
      router.push('/'); // Use router.push for client-side navigation
    } catch (err) {
      console.log(err)
    }
  }

  return (
    <>
      <h1>Sign Up</h1>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleSubmit() // Await the handleSubmit function
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
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default SignUp