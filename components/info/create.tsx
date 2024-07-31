import { useContext, useState } from "react"
import { AppContext } from "@/context/AppContext"
import { createdInfo } from "@/lib/api/info"

const Create = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Navbar must be used within an AppProvider")
  }
  const { user } = appContext
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const handleSend = async () => {
    try {
      if (user) {
        await createdInfo(user, title, body)
      }
      setTitle("")
      setBody("")
    } catch (error) {
      console.log(error.response.data.error.message)
    }
  }

  return (
    <>
      <h2>Create</h2>
      <form
        onSubmit={async (e) => {
          await handleSend()
        }}
      >
        <label htmlFor="title">Title</label>
        <input type="text" name="body" id="body" onChange={(e) => setTitle(e.target.value)}/>
        <label htmlFor="body">Body</label>
        <input type="text" name="body" id="body" onChange={(e) => setBody(e.target.value)}/>
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default Create
