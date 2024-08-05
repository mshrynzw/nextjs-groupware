import { deletedTodo } from "@/lib/api/todo"
import { getLocalTime } from "@/lib/datetime"

const Delete = ({ deleteTodo, setScreen, refetch }) => {
  const handleDelete = async () => {
    await deletedTodo(deleteTodo.id)
    refetch()
    setScreen("find")
  }

  const localTime = getLocalTime(deleteTodo.attributes.createdAt)

  return (
    <>
      <h2>Delete</h2>
      <h3>{deleteTodo.attributes.name}</h3>
      <p>Updated at {localTime}</p>
      <p>{deleteTodo.attributes.description}</p>
      <p>{String(deleteTodo.attributes.priority)}</p>
      <p>{String(deleteTodo.attributes.completed)}</p>
      <p>{new Date(deleteTodo.attributes.due).toLocaleString()}</p>
      <button onClick={handleDelete}>Delete</button>
    </>
  )
}

export default Delete
