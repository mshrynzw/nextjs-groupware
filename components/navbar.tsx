import Link from "next/link"
import { useContext } from "react"
import { AppContext } from "@/context/AppContext"
import { useRouter } from "next/router"

const Navbar = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Navbar must be used within an AppProvider")
  }
  const { user, setUser } = appContext

  const router = useRouter()
  const handleLogout = () => {
    setUser(null)
    router.push("/login")
  }

  return (
    <header className="bg-gray-500">
      <ul>
        <li><Link href="/">Home</Link></li>
        <li><Link href="/info">Info</Link></li>
        <li><Link href="/chat">Chat</Link></li>
        <li>Time Card</li>
        <li>Setting</li>
        {user ? (
          <li>{user.username}</li>
        ) : (
          <li><Link href="/signup">Sign Up</Link></li>
        )}
        {user ? (
          <li>
            <button onClick={handleLogout}>Logout</button>
          </li>
        ) : (
          <li><Link href="/login">Login</Link></li>
        )}
      </ul>
    </header>
  )
}

export default Navbar
