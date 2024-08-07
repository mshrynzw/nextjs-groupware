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
          Create
        </h1>
        <form
          className="flex flex-col"
          onSubmit={async (e) => {
            await handleSend()
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
          <input type="text" name="title" id="title"
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
          <textarea name="body" id="body" rows="20"
                    className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                    onChange={(e) => setBody(e.target.value)}
          />
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

export default Create
