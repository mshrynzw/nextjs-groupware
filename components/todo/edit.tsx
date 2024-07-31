import { useState } from "react"
import { editedTodo } from "@/lib/api/todo"

const Edit = ({ editTodo, setScreen, refetch }) => {
  const [name, setName] = useState<string>(editTodo.attributes.name)
  const [description, setDescription] = useState<string>(editTodo.attributes.description)
  const [priority, setPriority] = useState<number>(editTodo.attributes.priority)
  const [completed, setCompleted] = useState<boolean>(editTodo.attributes.completed)
  const [due, setDue] = useState<string>(editTodo.attributes.due)

  const handleEdit = async () => {
    await editedTodo(editTodo.id, name, description, priority, completed, due)
    refetch()
    setScreen("find")
  }

  const localTime = new Date(editTodo.attributes.updatedAt).toLocaleString()

  return (
    <>
      <h2>Edit</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleEdit()
        }}
      >
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p>Updated at {localTime}</p>
        <label htmlFor="description">Body</label>
        <input
          type="text"
          name="description"
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
        <label htmlFor="Priority">Priority</label>
        <input
          type="number"
          name="priority"
          id="priority"
          value={String(priority)}
          min="1"
          max="5"
          onChange={(e) => setPriority(Number(e.target.value))}
        />
        <label htmlFor="completed">Completed</label>
        <input
          type="checkbox"
          name="completed"
          id="completed"
          value={String(completed)}
          onChange={(e) => setCompleted(Boolean(e.target.value))}
        />
        <label htmlFor="due">Due</label>
        <input
          type="datetime-local"
          name="due"
          id="due"
          value={due}
          onChange={(e) => setDue(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default Edit
