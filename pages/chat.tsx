import { NextPage } from "next"
import Create from "@/components/chat/create"
import Find from "@/components/chat/find"


const Chat : NextPage = () => {
    return (
    <>
      <Find/>
      <Create/>
    </>
  )
}

export default Chat
