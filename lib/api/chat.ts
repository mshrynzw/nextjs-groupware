import Cookies from "js-cookie"
import { User } from "@/types/user"

export const postChat = async (user : User, text : string) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/chats`, {
      method : "POST",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : { text, user }
      })
    })
  } catch (error) {
    throw error
  }
}
