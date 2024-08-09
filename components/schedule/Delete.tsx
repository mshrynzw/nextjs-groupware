import React from "react"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faTrash } from "@fortawesome/free-solid-svg-icons"
import { deletedSchedule } from "@/lib/api/schedule"


const Delete = ({ deleteSchedule, setScreen, refetch }) => {
  const handleSend = async () => {
    await deletedSchedule(Number(deleteSchedule.event.id))
    refetch()
    setScreen("find")
  }

  return (
    <div>
      <h1
        className="mr-1 mb-6 w-full border-b-4 bg-white py-1 text-center font-bold uppercase outline-none ease-linear text-blueGray-800 border-blueGray-800 focus:outline-none"
      >
        <FontAwesomeIcon
          icon={faTrash}
          className={
            "fas fa-tv mr-2"
          }
        />
        Delete
      </h1>
      <button
        className="mr-1 mb-1 w-full rounded-xl px-6 py-3 text-sm font-bold uppercase text-white shadow-xl outline-none ease-linear bg-blueGray-800 focus:outline-none"
        onClick={async () => {
          await handleSend()
        }}
      >
        Submit
      </button>
    </div>
  )
}

export default Delete
