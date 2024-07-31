import { useContext, useState } from "react"
import { AppContext } from "@/context/AppContext"
import { createdTodo } from "@/lib/api/todo"

const Create = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Navbar must be used within an AppProvider")
  }
  const { user } = appContext
  const [name, setName] = useState<string>("")
  const [description, setDescription] = useState<string>("")
  const [priority, setPriority] = useState<number>(3)
  const [completed, setCompleted] = useState<boolean>(false)
  const [due, setDue] = useState<string>("")

  const handleSend = async () => {
    try {
      if (user) {
        await createdTodo(user, name, description, priority, completed, due)
      }
      setName("")
      setDescription("")
      setPriority(3)
      setCompleted(false)
      setDue("")
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
        <label htmlFor="name">Name</label>
        <input type="text" name="name" id="name" onChange={(e) => setName(e.target.value)}/>
        <label htmlFor="description">Description</label>
        <input type="text" name="description" id="description" onChange={(e) => setDescription(e.target.value)}/>
        <label htmlFor="priority">Priority</label>
        <input type="number" name="priority" id="priority" min="1" max="5" onChange={(e) => setPriority(Number(e.target.value))}/>
        <label htmlFor="completed">Completed</label>
        <input type="checkbox" name="completed" id="completed" onChange={(e) => setCompleted(Boolean(e.target.value))}/>
        <label htmlFor="due">Due</label>
        <input type="datetime-local" name="due" id="due" onChange={(e) => setDue(e.target.value)}/>
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default Create
