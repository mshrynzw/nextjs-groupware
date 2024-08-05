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
        <label htmlFor="title"
               className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
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
          className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
        >
          {deleteInfo.attributes.title}
        </p>
        <label htmlFor="body"
               className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
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
          className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
        >
          {deleteInfo.attributes.body}
        </p>
        <label htmlFor="updated"
               className="block uppercase text-blueGray-600 text-sm font-bold mb-2"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Updated
        </label>
        <div className="pb-8 flex items-end justify-between">
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
                className="bg-blueGray-800 text-white text-sm font-bold uppercase px-6 py-3 rounded-xl shadow-xl outline-none focus:outline-none mr-1 mb-1 w-full ease-linear"
        >
          Submit
        </button>
      </div>
    </div>
  )
}

export default Delete