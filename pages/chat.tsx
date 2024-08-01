import { NextPage } from "next"
import { useContext, useState } from "react"
import { postMessage } from "@/lib/api/chat"
import Read from "@/components/chat/read"
import { AppContext } from "@/context/AppContext"

const Chat : NextPage = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext
  const [sendMessage, setSendMessage] = useState("")
  const handleSend = async () => {
    try {
      if (user) {
        await postMessage(user, sendMessage)
      }
      setSendMessage("")
    } catch (error) {
      console.log(error.response.data.error.message)
    }
  }

  return (
    <>
      <h1>Chat</h1>
      <Read/>
      <form
        onSubmit={async (e) => {
          await handleSend()
        }}
      >
        <label htmlFor="text">Text</label>
        <input
          type="text"
          name="text"
          id="text"
          onChange={(e) => setSendMessage(e.target.value)}
        />
        <button type="submit">Send</button>
      </form>
    </>
  )
}

export default Chat
