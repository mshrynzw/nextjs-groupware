import { NextPage } from "next"
import Create from "@/components/chat/Create"
import Find from "@/components/chat/Find"


const Chat : NextPage = () => {
    return (
    <>
      <Find/>
      <Create/>
    </>
  )
}

export default Chat
