import Cookies from "js-cookie"
import { User } from "@/types/user"

export const createdGroup = async (name : string, users : User[]) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups`, {
      method : "POST",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : { name, users }
      })
    })
  } catch (error) {
    throw error
  }
}

export const editedGroup = async (id : number, name : string, users : User[]) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${id}`, {
      method : "PUT",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : { name, users }
      })
    })
  } catch (error) {
    throw error
  }
}

export const deletedGroup = async (id : number) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/groups/${id}`, {
      method : "DELETE",
      headers : {
        Authorization : `Bearer ${token}`
      }
    })
  } catch (error) {
    throw error
  }
}
