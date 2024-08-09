import React, { useContext, useState } from "react"
import { AppContext } from "@/context/AppContext"
import { createdInfo } from "@/lib/api/info"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faSnowflake } from "@fortawesome/free-solid-svg-icons"

const Create = () => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext
  const [title, setTitle] = useState("")
  const [body, setBody] = useState("")
  const handleSend = async () => {
    try {
      if (user) {
        await createdInfo(user, title, body)
      }
      setTitle("")
      setBody("")
    } catch (error) {
      console.error(error.response.data.error.message)
    }
  }

  return (
    <div className="flex h-full items-center justify-center">
      <div className="m-8 w-full rounded-xl bg-white p-8 shadow-xl max-w xl:mx-64">
        <h1
          className="mr-1 mb-8 w-full border-b-4 bg-white py-1 text-center font-bold uppercase outline-none ease-linear text-blueGray-800 border-blueGray-800 focus:outline-none"
        >
          <FontAwesomeIcon
            icon={faPenToSquare}
            className={
              "fas fa-tv mr-2"
            }
          />
          Create
        </h1>
        <form
          className="flex flex-col"
          onSubmit={async (e) => {
            await handleSend()
          }}
        >
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
          <input type="text" name="title" id="title"
                 className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                 onChange={(e) => setTitle(e.target.value)}
          />
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
          <textarea name="body" id="body" rows="20"
                    className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                    onChange={(e) => setBody(e.target.value)}
          />
          <button type="submit"
                  className="mr-1 mb-1 w-full rounded-xl px-6 py-3 text-sm font-bold uppercase text-white shadow-xl outline-none ease-linear bg-blueGray-800 focus:outline-none"
          >
            Submit
          </button>
        </form>
      </div>
    </div>
  )
}

export default Create
