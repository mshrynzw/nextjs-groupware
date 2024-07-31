import Cookies from "js-cookie"
import { TimecardSetting } from "@/types/timecardSetting"

export const createTimecard = async (user, date , type, startWork, startBreak, endBreak, endWork) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timecards`, {
      method : "POST",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : {
          user,
          date,
          type,
          startWork,
          startBreak,
          endBreak,
          endWork
        }
      })
    })
  } catch (error) {
    throw error
  }
}

export const editedTimecard = async (id, type, startWork, startBreak, endBreak, endWork) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timecards/${id}`, {
      method : "PUT",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : {
          type,
          startWork,
          startBreak,
          endBreak,
          endWork
        }
      })
    })
  } catch (error) {
    throw error
  }
}

export const deletedTimecard = async (id : number) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timecards/${id}`, {
      method : "DELETE",
      headers : {
        Authorization : `Bearer ${token}`
      }
    })
  } catch (error) {
    throw error
  }
}
