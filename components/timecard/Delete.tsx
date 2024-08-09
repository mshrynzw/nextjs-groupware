import React from "react"
import { deletedTimecard } from "@/lib/api/timecard"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSnowflake, faTrash } from "@fortawesome/free-solid-svg-icons"
import { formatTime } from "@/lib/datetime"

const Delete = ({ deleteTimecard, setScreen, refetch }) => {
  const handleDelete = async () => {
    await deletedTimecard(deleteTimecard.id)
    refetch()
    setScreen("find")
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="m-8 w-full rounded-xl bg-white p-8 shadow-xl max-w xl:mx-64">
        <h1
          className="mr-1 mb-8 w-full border-b-4 bg-white py-1 text-center font-bold uppercase outline-none ease-linear text-blueGray-800 border-blueGray-800 focus:outline-none"
        >
          <FontAwesomeIcon
            icon={faTrash}
            className={
              "fas fa-tv mr-2"
            }
          />
          Delete
        </h1>

        <div className="flex flex-row">
          <div className="flex basis-1/2 flex-col">
            <label htmlFor="date"
                   className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
            >
              <FontAwesomeIcon
                icon={faSnowflake}
                className={
                  "fas fa-tv mr-2 text-sm text-blueGray-300"
                }
              />{" "}
              Date
            </label>
            <p className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring">
              {new Date(deleteTimecard.attributes.date).toLocaleDateString()}
            </p>
          </div>

          <div className="flex basis-1/2 flex-col">
            <label htmlFor="type"
                   className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
            >
              <FontAwesomeIcon
                icon={faSnowflake}
                className={
                  "fas fa-tv mr-2 text-sm text-blueGray-300"
                }
              />{" "}
              Type
            </label>
            <p className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring">
              {deleteTimecard.attributes.type.data.attributes.name}
            </p>
          </div>
        </div>

        <label htmlFor="startWork"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Start Work
        </label>
        <p className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring">
          {formatTime(deleteTimecard.attributes.startWork)}
        </p>

        <label htmlFor="startBreak"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Start Break
        </label>
        <p className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring">
          {formatTime(deleteTimecard.attributes.startBreak)}
        </p>

        <label htmlFor="endBreak"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          End Break
        </label>
        <p className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring">
          {formatTime(deleteTimecard.attributes.endBreak)}
        </p>

        <label htmlFor="endWork"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          End Work
        </label>
        <p className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring">
          {formatTime(deleteTimecard.attributes.endWork)}
        </p>

        <button onClick={handleDelete}
                className="mr-1 mb-1 w-full rounded-xl px-6 py-3 text-sm font-bold uppercase text-white shadow-xl outline-none ease-linear bg-blueGray-800 focus:outline-none"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

export default Delete
