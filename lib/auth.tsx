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
    window.location.href = "/"
    return res
  } catch (err) {
    console.log(err)
    throw err
  }
}

export const login = (identifier : string, password : string) => {
  return axios
  .post(`${API_URL}/api/auth/local`, {
    identifier,
    password
  }).then((res) => {
    Cookie.set("token", res.data.jwt, { expires : 7 })
    window.location.href = "/login"
    return res
  }).catch((err) => {
    console.log(err)
    throw err
  })
}