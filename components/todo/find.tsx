import { useEffect } from "react"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"

const query = gql`
  {
    todos(sort: "updatedAt:asc"){
      data{
        id
        attributes{
          name
          description
          priority
          completed
          due
          updatedAt
        }
      }
    }
  }
`

const Find = ({ setScreen, setEditTodo, setDeleteTodo, refetchFlag }) => {
  const { loading, error, data, refetch } = useQuery(query)

  useEffect(() => {
    refetch()
  }, [refetchFlag])

  const handleEdit = (todo) => {
    setEditTodo(todo)
    setScreen("edit")
  }

  const handleDelete = (todo) => {
    setDeleteTodo(todo)
    setScreen("delete")
  }

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  return (
    <>
      <h2>Find</h2>
      {data.todos.data.map((todo) => {
        try {
          const localTime = new Date(todo.attributes.updatedAt).toLocaleString()
          return (
            <div key={todo.id}>
              <h3>{todo.attributes.name}</h3>
              <p>Updated at {localTime}</p>
              <p>{todo.attributes.description}</p>
              <p>{String(todo.attributes.priority)}</p>
              <p>{String(todo.attributes.completed)}</p>
              <p>{new Date(todo.attributes.due).toLocaleString()}</p>
              <button onClick={() => handleEdit(todo)}>Edit</button>
              <button onClick={() => handleDelete(todo)}>Delete</button>
            </div>
          )
        } catch (e) {
          console.error("Error processing message:", todo, e)
          return <p key={todo.id}>Error displaying message</p>
        }
      })}
    </>
  )
}

export default Find
