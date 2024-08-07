import { deletedTimecard } from "@/lib/api/timecard"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSnowflake, faTrash } from "@fortawesome/free-solid-svg-icons"
import React from "react"
import { formatTime } from "@/lib/datetime"

const Delete = ({ deleteTimecard, setScreen, refetch }) => {
  const handleDelete = async () => {
    await deletedTimecard(deleteTimecard.id)
    refetch()
    setScreen("find")
  }

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w bg-white shadow-xl rounded-xl m-8 xl:mx-64 p-8">
        <h1
          className="mb-8 text-blueGray-800 border-b-4 border-blueGray-800 bg-white font-bold uppercase text-center py-1 outline-none focus:outline-none mr-1 w-full ease-linear"
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
          <div className="flex flex-col basis-1/2">
            <label htmlFor="date"
                   className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
            >
              <FontAwesomeIcon
                icon={faSnowflake}
                className={
                  "fas fa-tv mr-2 text-sm text-blueGray-300"
                }
              />{" "}
              Date
            </label>
            <p className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150">
              {new Date(deleteTimecard.attributes.date).toLocaleDateString()}
            </p>
          </div>

          <div className="flex flex-col basis-1/2">
            <label htmlFor="type"
                   className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
            >
              <FontAwesomeIcon
                icon={faSnowflake}
                className={
                  "fas fa-tv mr-2 text-sm text-blueGray-300"
                }
              />{" "}
              Type
            </label>
            <p className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150">
              {deleteTimecard.attributes.type.data.attributes.name}
            </p>
          </div>
        </div>

        <label htmlFor="startWork"
               className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Start Work
        </label>
        <p className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150">
          {formatTime(deleteTimecard.attributes.startWork)}
        </p>

        <label htmlFor="startBreak"
               className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Start Break
        </label>
        <p className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150">
          {formatTime(deleteTimecard.attributes.startBreak)}
        </p>

        <label htmlFor="endBreak"
               className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          End Break
        </label>
        <p className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150">
          {formatTime(deleteTimecard.attributes.endBreak)}
        </p>

        <label htmlFor="endWork"
               className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          End Work
        </label>
        <p className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150">
          {formatTime(deleteTimecard.attributes.endWork)}
        </p>

        <button onClick={handleDelete}
                className="bg-blueGray-800 text-white text-sm font-bold uppercase px-6 py-3 rounded-xl shadow-xl outline-none focus:outline-none mr-1 mb-1 w-full ease-linear"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

export default Delete
