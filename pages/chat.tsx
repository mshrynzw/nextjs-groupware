import { NextPage } from "next"
import Head from "next/head"
import Create from "@/components/chat/Create"
import Find from "@/components/chat/Find"


const Chat : NextPage = () => {
    return (
    <>
      <Head>
        <title>Chat</title>
      </Head>
      <Find/>
      <Create/>
    </>
  )
}

export default Chat
