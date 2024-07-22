import Link from "next/link"
import { useContext } from "react"
import { AppContext } from "@/context/AppContext"
import Cookies from "js-cookie"
import { useRouter } from "next/router"

const Navbar = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Navbar must be used within an AppProvider")
  }
  const { username, setUsername } = appContext

  const router = useRouter()
  const handleLogout = () => {
    // TODO
    // Cookies.remove("token")
    setUsername(null)
    router.push("/")
  }

  return (
    <header className="bg-gray-500">
      <ul>
        <li><Link href="/">Home</Link></li>
        <li>Info</li>
        <li>Chat</li>
        <li>Time Card</li>
        <li>Setting</li>
        {username ? (
          <li>{username}</li>
        ) : (
          <li><Link href="/signup">Sign Up</Link></li>
        )}
        {username ? (
          <li><a href="#" onClick={handleLogout}>Logout</a></li>
        ) : (
          <li><Link href="/login">Login</Link></li>
        )}
      </ul>
    </header>
  )
}

export default Navbar