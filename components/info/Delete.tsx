import React from "react"
import { deletedInfo } from "@/lib/api/info"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faSnowflake, faTrash } from "@fortawesome/free-solid-svg-icons"
import { getLocalTime } from "@/lib/datetime"

const Delete = ({ deleteInfo, setScreen, refetch }) => {
  const handleDelete = async () => {
    await deletedInfo(deleteInfo.id)
    refetch()
    setScreen("find")
  }

  const localTime = getLocalTime(deleteInfo.attributes.updatedAt)

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

        <label htmlFor="title"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Title
        </label>
        <p
          className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
        >
          {deleteInfo.attributes.title}
        </p>

        <label htmlFor="body"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Body
        </label>
        <p
          className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
        >
          {deleteInfo.attributes.body}
        </p>

        <label htmlFor="updated"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Updated
        </label>
        <div className="flex items-end justify-between pb-8">
          <p className="text-sm text-blueGray-400">
            <span className="whitespace-nowrap">
              {localTime}
            </span>
            <span className="ml-2 text-lightBlue-500">
              {deleteInfo.attributes.user.data.attributes.username}
            </span>
          </p>
        </div>
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