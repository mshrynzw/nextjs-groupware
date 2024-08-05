import React, { useState } from "react"
import { editedInfo } from "@/lib/api/info"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faSnowflake } from "@fortawesome/free-solid-svg-icons"

const Edit = ({ editInfo, setScreen, refetch }) => {
  const [title, setTitle] = useState<string>(editInfo.attributes.title)
  const [body, setBody] = useState<string>(editInfo.attributes.body)

  const handleEdit = async () => {
    await editedInfo(editInfo.id, title, body)
    refetch()
    setScreen("find")
  }

  const localTime = new Date(editInfo.attributes.updatedAt).toLocaleString("ja-JP", {
    year : "numeric",
    month : "2-digit",
    day : "2-digit",
    hour : "2-digit",
    minute : "2-digit",
    hour12 : false // 24時間表示
  })

  return (
    <div className="flex items-center justify-center h-full">
      <div className="w-full max-w bg-white shadow-xl rounded-xl m-8 xl:mx-64 p-8">
        <h1
          className="mb-8 text-blueGray-800 border-b-4 border-blueGray-800 bg-white font-bold uppercase text-center py-1 outline-none focus:outline-none mr-1 w-full ease-linear"
        >
          <FontAwesomeIcon
            icon={faPenToSquare}
            className={
              "fas fa-tv mr-2"
            }
          />
          Edit
        </h1>
        <form
          className="flex flex-col"
          onSubmit={async (e) => {
            e.preventDefault()
            await handleEdit()
          }}
        >
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
          <input type="text" name="title" id="title" value={title}
                 className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                 onChange={(e) => setTitle(e.target.value)}
          />
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
          <textarea name="body" id="body" rows="20" value={body}
                    className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    onChange={(e) => setBody(e.target.value)}
          />
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
              {editInfo.attributes.user.data.attributes.username}
            </span>
            </p>
          </div>
          <button type="submit"
                  className="bg-blueGray-800 text-white text-sm font-bold uppercase px-6 py-3 rounded-xl shadow-xl outline-none focus:outline-none mr-1 mb-1 w-full ease-linear"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

export default Edit
