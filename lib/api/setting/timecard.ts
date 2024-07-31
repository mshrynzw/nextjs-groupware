import Cookies from "js-cookie"

export const createTimecardSetting = async (name : string, description : string, order : number, color : string) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timecard-settings`, {
      method : "POST",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : {
          name,
          description,
          order,
          color
        }
      })
    })
  } catch (error) {
    throw error
  }
}

export const editedTimecardSetting = async (id, name, description, order, color) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timecard-settings/${id}`, {
      method : "PUT",
      headers : {
        "Content-Type" : "application/json",
        Authorization : `Bearer ${token}`
      },
      body : JSON.stringify({
        data : { name, description, order, color }
      })
    })
  } catch (error) {
    throw error
  }
}

export const deletedTimecardSetting = async (id : number) => {
  const token = Cookies.get("token")
  try {
    await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/timecard-settings/${id}`, {
      method : "DELETE",
      headers : {
        Authorization : `Bearer ${token}`
      }
    })
  } catch (error) {
    throw error
  }
}
