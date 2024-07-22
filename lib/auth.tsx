import axios from "axios"
import Cookie from "js-cookie"

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:1337"

export const register = async (username : string, email : string, password : string) => {
  try {
    const res = await axios.post(`${API_URL}/api/auth/local/register`, {
      username,
      email,
      password
    })
    Cookie.set("token", res.data.jwt, { expires : 7 })
    return res
  } catch (err) {
    console.log(err)
    throw err
  }
}

export const login = async (identifier : string, password : string) => {
  try {
    const res = await axios.post(`${API_URL}/api/auth/local`, {
      identifier,
      password
    })
    Cookie.set("token", res.data.jwt, { expires : 7 })
    return res
  } catch (err) {
    console.log(err)
    throw err
  }
}