import { NextPage } from "next"
import Find from "@/components/schedule/Find"
import Create from "@/components/schedule/Create"
import Edit from "@/components/schedule/Edit"
import { useState } from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faRectangleList } from "@fortawesome/free-solid-svg-icons"
import Delete from "@/components/schedule/Delete"

const Schedule : NextPage = () => {
  const [screen, setScreen] = useState("find")
  const [createSchedule, setCreateSchedule] = useState(null)
  const [editSchedule, setEditSchedule] = useState(null)
  const [deleteSchedule, setDeleteSchedule] = useState(null)
  const [refetchFlag, setRefetchFlag] = useState(false)

  const refetch = () => {
    setRefetchFlag(!refetchFlag)
  }
  return (
    <div className="flex flex-row">

      {/*<div className="relative block w-full min-w-0 overflow-x-auto break-words rounded-lg bg-white p-4 shadow-lg">*/}
      <div className={`relative block min-w-0 w-full overflow-x-auto break-words rounded-lg bg-white p-4 shadow-lg ${screen !== "find" ? "mr-64" : null}`}>
        <Find setScreen={setScreen} setCreateSchedule={setCreateSchedule} setEditSchedule={setEditSchedule} setDeleteSchedule={setDeleteSchedule} refetchFlag={refetchFlag}/>
      </div>
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
      ) : screen === "editDelete" && editSchedule !== null ? (
        <div className="absolute inset-y-0 right-0 w-64 bg-white px-6 py-4 shadow-xl">
          <div className="space-y-24">
            <Edit setScreen={setScreen} editSchedule={editSchedule} refetch={refetch}/>
            <Delete setScreen={setScreen} deleteSchedule={deleteSchedule} refetch={refetch}/>
          </div>
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
        <div className="absolute inset-y-0 right-0 w-64 bg-white px-6 py-4 shadow-xl">
          <Create createSchedule={createSchedule}/>
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
    </div>
  )
}

export default Schedule
