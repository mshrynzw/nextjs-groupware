import { NextPage } from "next"
import { useState } from "react"
import Find from "@/components/todo/Find"
import Delete from "@/components/todo/Delete"
import Create from "@/components/todo/Create"
import Edit from "@/components/todo/Edit"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faRectangleList } from "@fortawesome/free-solid-svg-icons"
import Head from "next/head"

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
      <Head>
        <title>Todo</title>
      </Head>
      <Find setScreen={setScreen} setEditTodo={setEditTod} setDeleteTodo={setDeleteTodo} refetchFlag={refetchFlag}/>
      {screen === "find" ? (
        <button
          className="fixed right-6 bottom-6 rounded-xl p-2 text-white shadow-xl bg-blueGray-700 hover:text-blueGray-100 hover:shadow-sm"
          onClick={() => setScreen("create")}
        >
          <FontAwesomeIcon
            icon={faPenToSquare}
            className="h-8 w-8 p-2"
          />
        </button>
      ) : screen === "edit" && editTodo !== null ? (
        <div className="fixed top-0 right-0 bottom-0 left-0 min-h-screen opacity-95 bg-blueGray-50 md:ml-64">
          <Edit editTodo={editTodo} setScreen={setScreen} refetch={refetch}/>
          <button
            className="fixed right-6 bottom-6 rounded-xl p-2 text-white shadow-xl bg-blueGray-700 hover:text-blueGray-100 hover:shadow-sm"
            onClick={() => setScreen("find")}
          >
            <FontAwesomeIcon
              icon={faRectangleList}
              className="h-8 w-8 p-2"
            />
          </button>
        </div>
      ) : screen === "delete" && deleteTodo !== null ? (
        <div className="fixed top-0 right-0 bottom-0 left-0 min-h-screen opacity-95 bg-blueGray-50 md:ml-64">
          <Delete deleteTodo={deleteTodo} setScreen={setScreen} refetch={refetch}/>
          <button
            className="fixed right-6 bottom-6 rounded-xl p-2 text-white shadow-xl bg-blueGray-700 hover:text-blueGray-100 hover:shadow-sm"
            onClick={() => setScreen("find")}
          >
            <FontAwesomeIcon
              icon={faRectangleList}
              className="h-8 w-8 p-2"
            />
          </button>
        </div>
      ) : screen === "create" ? (
        <div className="fixed top-0 right-0 bottom-0 left-0 min-h-screen opacity-95 bg-blueGray-50 md:ml-64">
          <Create/>
          <button
            className="fixed right-6 bottom-6 rounded-xl p-2 text-white shadow-xl bg-blueGray-700 hover:text-blueGray-100 hover:shadow-sm"
            onClick={() => setScreen("find")}
          >
            <FontAwesomeIcon
              icon={faRectangleList}
              className="h-8 w-8 p-2"
            />
          </button>
        </div>
      ) : null}
    </>
  )
}

export default Todo
