import { NextPage } from "next"
import { useState } from "react"
import Find from "@/components/info/find"
import Delete from "@/components/info/delete"
import Create from "@/components/info/create"
import Edit from "@/components/info/edit"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faRectangleList } from "@fortawesome/free-solid-svg-icons"

const Info : NextPage = () => {
  const [screen, setScreen] = useState("find")
  const [editInfo, setEditInfo] = useState(null)
  const [deleteInfo, setDeleteInfo] = useState(null)
  const [refetchFlag, setRefetchFlag] = useState(false)

  const refetch = () => {
    setRefetchFlag(!refetchFlag)
  }

  return (
    <>
      <Find setScreen={setScreen} setEditInfo={setEditInfo} setDeleteInfo={setDeleteInfo} refetchFlag={refetchFlag}/>
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
      ) : screen === "edit" && editInfo !== null ? (
        <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen md:ml-64 bg-blueGray-50 opacity-95">
          <Edit editInfo={editInfo} setScreen={setScreen} refetch={refetch}/>
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
      ) : screen === "delete" && deleteInfo !== null ? (
        <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen md:ml-64 bg-blueGray-50 opacity-95">
          <Delete deleteInfo={deleteInfo} setScreen={setScreen} refetch={refetch}/>
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
        <div className="fixed top-0 left-0 right-0 bottom-0 min-h-screen md:ml-64 bg-blueGray-50 opacity-95">
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

export default Info
