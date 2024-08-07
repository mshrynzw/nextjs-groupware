import { NextPage } from "next"
import { useState } from "react"
import Find from "@/components/timecard/find"
import Edit from "@/components/timecard/edit"
import Create from "@/components/timecard/create"
import Delete from "@/components/timecard/delete"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faRectangleList } from "@fortawesome/free-solid-svg-icons"

const Timecard : NextPage = () => {
  const [screen, setScreen] = useState("find")
  const [editTimecard, setEditTimecard] = useState(null)
  const [deleteTimecard, setDeleteTimecard] = useState(null)
  const [createDate, setCreateDate] = useState<string>(null)
  const [refetchFlag, setRefetchFlag] = useState(false)

  const handleFind = () => {
    setScreen("find")
  }

  const handleCreate = () => {
    setScreen("create")
  }

  const handleDelete = () => {
    setScreen("delete")
  }

  const refetch = () => {
    setRefetchFlag(!refetchFlag)
  }

  return (
    <>
      <Find setScreen={setScreen} setEditTimecard={setEditTimecard} setDeleteTimecard={setDeleteTimecard} setCreateDate={setCreateDate} refetchFlag={refetchFlag}/>
      {screen === "edit" && editTimecard !== null ? (
        <div className="fixed top-0 right-0 bottom-0 left-0 z-10 min-h-screen opacity-95 bg-blueGray-50 md:ml-64">
          <Edit editTimecard={editTimecard} setScreen={setScreen} refetch={refetch}/>
          <button
            className="fixed right-6 bottom-6 rounded-xl p-2 text-white shadow-xl bg-blueGray-700 hover:text-blueGray-100 hover:shadow-sm"
            onClick={handleFind}
          >
            <FontAwesomeIcon
              icon={faRectangleList}
              className="h-8 w-8 p-2"
            />
          </button>
        </div>
      ) : screen === "delete" && deleteTimecard !== null ? (
        <div className="fixed top-0 left-0 right-0 bottom-0 z-10 min-h-screen md:ml-64 bg-blueGray-50 opacity-95">
          <Delete deleteTimecard={deleteTimecard} setScreen={setScreen} refetch={refetch}/>
          <button
            className="fixed right-6 bottom-6 rounded-xl p-2 text-white shadow-xl bg-blueGray-700 hover:text-blueGray-100 hover:shadow-sm"
            onClick={handleFind}
          >
            <FontAwesomeIcon
              icon={faRectangleList}
              className="h-8 w-8 p-2"
            />
          </button>
        </div>
      ) : screen === "create" ? (
        <div className="fixed top-0 right-0 bottom-0 left-0 z-10 min-h-screen opacity-95 bg-blueGray-50 md:ml-64">
          <Create createDate={createDate}/>
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

export default Timecard
