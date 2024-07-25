import Cookies from "js-cookie"
import { User } from "@/types/user"

export const postMessage = async (user : User, text : string) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/messages`, {
      method : "POST",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : {
          text : text,
          user : user
        }
      })
    })
  } catch (error) {
    throw error
  }
}
