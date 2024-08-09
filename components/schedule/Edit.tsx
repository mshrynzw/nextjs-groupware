import React, { useState, useEffect } from "react"
import { editedSchedule } from "@/lib/api/schedule"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faEllipsis, faSnowflake, faTrash } from "@fortawesome/free-solid-svg-icons"
import { formatDateTimeByEventCalender } from "@/lib/datetime"

const Edit = ({ editSchedule, setScreen, refetch }) => {
  const [eventData, setEventData] = useState({
    start : "",
    end : "",
    title : "",
    textColor : "",
    backgroundColor : ""
  })

  useEffect(() => {
    setEventData({
      start : formatDateTimeByEventCalender(editSchedule.event.start),
      end : formatDateTimeByEventCalender(editSchedule.event.end),
      title : editSchedule.event.title,
      textColor : editSchedule.event.textColor,
      backgroundColor : editSchedule.event.backgroundColor
    })
  }, [editSchedule])

  const handleChange = (e : React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setEventData(prev => ({ ...prev, [name] : value }))
  }

  const handleSend = async () => {
    await editedSchedule(Number(editSchedule.event.id), new Date(eventData.start), new Date(eventData.end), eventData.title, eventData.textColor, eventData.backgroundColor)
    refetch()
    setScreen("find")
  }

  return (
    <div>
      <h1
        className="mr-1 mb-6 w-full border-b-4 bg-white py-1 text-center font-bold uppercase outline-none ease-linear text-blueGray-800 border-blueGray-800 focus:outline-none"
      >
        <FontAwesomeIcon
          icon={faEllipsis}
          className={
            "fas fa-tv mr-2"
          }
        />
        Edit
      </h1>
      <form
        onSubmit={async () => {
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
        <input type="datetime-local" name="start" id="start" value={eventData.start} required
               className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={handleChange}
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
        <input type="datetime-local" name="end" id="end" value={eventData.end} required
               className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={handleChange}
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
        <input type="text" name="title" id="title" value={eventData.title} required
               className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={handleChange}
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
        <input type="color" name="textColor" id="textColor" value={eventData.textColor} required
               className="mb-8 w-full rounded border-0 bg-white text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={handleChange}
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
        <input type="color" name="backgroundColor" id="backgroundColor" value={eventData.backgroundColor} required
               className="mb-8 w-full rounded border-0 bg-white text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
               onChange={handleChange}
        />

        <button type="submit"
                className="mr-1 mb-1 w-full rounded-xl px-6 py-3 text-sm font-bold uppercase text-white shadow-xl outline-none ease-linear bg-blueGray-800 focus:outline-none"
        >
          Submit
        </button>
      </form>
    </div>
  )
}

export default Edit