import Cookies from "js-cookie"
import { User } from "@/types/user"

export const createdTodo = async (user : User, name : string, description : string, priority : number, completed : boolean, due : string) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/todos`, {
      method : "POST",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : { user, name, description, priority, completed, due }
      })
    })
  } catch (error) {
    throw error
  }
}

export const editedTodo = async (id : number, name : string, description : string, priority : number, completed : boolean, due : string) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/todos/${id}`, {
      method : "PUT",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : { name, description, priority, completed, due }
      })
    })
  } catch (error) {
    throw error
  }
}

export const deletedTodo = async (id : number) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/todos/${id}`, {
      method : "DELETE",
      headers : {
        Authorization : `Bearer ${token}`
      }
    })
  } catch (error) {
    throw error
  }
}
