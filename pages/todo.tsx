import { NextPage } from "next"
import { useState } from "react"
import Find from "@/components/todo/find"
import Delete from "@/components/todo/delete"
import Create from "@/components/todo/create"
import Edit from "@/components/todo/edit"

const Todo : NextPage = () => {
  const [screen, setScreen] = useState("find")
  const [editTodo, setEditTod] = useState(null)
  const [deleteTodo, setDeleteTodo] = useState(null)
  const [refetchFlag, setRefetchFlag] = useState(false)

  const refetch = () => {
    setRefetchFlag(!refetchFlag)
  }

  return (
    <>
      <h1>Todo</h1>
      {screen === "find" ? (
        <Find setScreen={setScreen} setEditTodo={setEditTod} setDeleteTodo={setDeleteTodo} refetchFlag={refetchFlag}/>
      ) : screen === "edit" && editTodo !== null ?(
        <Edit editTodo={editTodo} setScreen={setScreen} refetch={refetch}/>
      ) : screen === "delete" && deleteTodo !== null ? (
        <Delete deleteTodo={deleteTodo} setScreen={setScreen} refetch={refetch}/>
      ) : screen === "create" ? (
        <Create/>
      ) : null}
      <button onClick={() => setScreen("find")}>Read</button>
      <button onClick={() => setScreen("create")}>Create</button>
    </>
  )
}

export default Todo
