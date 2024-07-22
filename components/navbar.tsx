import Link from "next/link"
import { useContext } from "react"
import { AppContext } from "@/context/AppContext"

const Navbar = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Navbar must be used within an AppProvider")
  }
  const { username } = appContext

  return (
    <header className="bg-gray-500">
      <ul>
        <li><Link href="/">Home</Link></li>
        <li>Info</li>
        <li>Chat</li>
        <li>Time Card</li>
        <li>Setting</li>
        <li>{username ? username : null}</li>
        <li><Link href="/signin">Sign In</Link></li>
        <li><Link href="/signup">Sign Up</Link></li>
      </ul>
    </header>
  )
}

export default Navbar