import React, { useContext, useEffect, useState } from "react"
import { AppContext } from "@/context/AppContext"
import { formatDateTimeByStrapi, getNow, getOneHourAgo } from "@/lib/datetime"
import { createdSchedule } from "@/lib/api/schedule"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faSnowflake } from "@fortawesome/free-solid-svg-icons"

const Create = ({ createSchedule }) => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext
  const [start, setStart] = useState<string>(formatDateTimeByStrapi(getNow()))
  const [end, setEnd] = useState<string>(formatDateTimeByStrapi(getOneHourAgo()))
  const [title, setTitle] = useState("")
  const [textColor, setTextColor] = useState<string>("#FFFFFF")
  const [backgroundColor, setBackgroundColor] = useState<string>("#475569")

  useEffect(() => {
    setStart(createSchedule?.startStr)
    setEnd(createSchedule?.endStr)
  }, [createSchedule])
  const handleSend = async () => {
    try {
      if (user) {
        await createdSchedule(user, new Date(start), new Date(end), title, textColor, backgroundColor)
      }
      setStart(formatDateTimeByStrapi(getNow()))
      setEnd(formatDateTimeByStrapi(getOneHourAgo()))
      setTitle("")
      setTextColor("#FFFFFF")
      setBackgroundColor("#475569")
    } catch (error) {
      console.error(error.response.data.error.message)
    }
  }

  return (
    <>
      <h1
        className="mr-1 mb-6 w-full border-b-4 bg-white py-1 text-center font-bold uppercase outline-none ease-linear text-blueGray-800 border-blueGray-800 focus:outline-none"
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
        onSubmit={async (e) => {
          await handleSend()
        }}
      >
        <label htmlFor="start"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Start
        </label>
        <input type="datetime-local" name="start" id="start" value={start} required
               className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={(e) => setStart(e.target.value)}
        />

        <label htmlFor="end"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          End
        </label>
        <input type="datetime-local" name="end" id="end" value={end} required
               className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={(e) => setEnd(e.target.value)}
        />

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
        <input type="text" name="title" id="title" value={title} required
               className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={(e) => setTitle(e.target.value)}
        />

        <label htmlFor="textColor"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Text Color
        </label>
        <input type="color" name="textColor" id="textColor" value={textColor} required
               className="mb-8 w-full rounded border-0 bg-white text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={(e) => setTextColor(e.target.value)}
        />

        <label htmlFor="backgroundColor"
               className="mb-2 block text-sm font-bold uppercase text-blueGray-600"
        >
          <FontAwesomeIcon
            icon={faSnowflake}
            className={
              "fas fa-tv mr-2 text-sm text-blueGray-300"
            }
          />{" "}
          Background Color
        </label>
        <input type="color" name="backgroundColor" id="backgroundColor" value={backgroundColor} required
               className="mb-8 w-full rounded border-0 bg-white text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={(e) => setBackgroundColor(e.target.value)}
        />

        <button type="submit"
                className="mr-1 mb-1 w-full rounded-xl px-6 py-3 text-sm font-bold uppercase text-white shadow-xl outline-none ease-linear bg-blueGray-800 focus:outline-none"
        >
          Submit
        </button>
      </form>
    </>
  )
}

export default Create