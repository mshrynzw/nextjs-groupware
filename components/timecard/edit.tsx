import React, { useState, useEffect } from "react"
import { TimecardSetting } from "@/types/timecardSetting"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"
import { editedTimecard } from "@/lib/api/timecard"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faSnowflake } from "@fortawesome/free-solid-svg-icons"
import { formatDate, formatDateTimeMinute } from "@/lib/datetime"

const query = gql`
  {
    timecardSettings {
      data {
        id
        attributes {
          name
          order
        }
      }
    }
  }
`

const Edit = ({ editTimecard, setScreen, refetch }) => {
  const [date, setDate] = useState<string>(editTimecard.attributes.date)
  const [timecardSetting, setTimecardSetting] = useState<TimecardSetting>(editTimecard.attributes.type.data)
  const [startWork, setStartWork] = useState<string>(formatDateTimeMinute(editTimecard.attributes.startWork))
  const [startBreak, setStartBreak] = useState<string>(formatDateTimeMinute(editTimecard.attributes.startBreak))
  const [endBreak, setEndBreak] = useState<string>(formatDateTimeMinute(editTimecard.attributes.endBreak))
  const [endWork, setEndWork] = useState<string>(formatDateTimeMinute(editTimecard.attributes.endWork))

  // useEffect(() => {
  //   setStartWork(new Date(editTimecard.attributes.startWork).toISOString().slice(0, 16))
  //   setStartBreak(new Date(editTimecard.attributes.startBreak).toISOString().slice(0, 16))
  //   setEndBreak(new Date(editTimecard.attributes.endBreak).toISOString().slice(0, 16))
  //   setEndWork(new Date(editTimecard.attributes.endWork).toISOString().slice(0, 16))
  // }, [editTimecard])

  const handleEdit = async () => {
    await editedTimecard(editTimecard.id, timecardSetting, startWork, startBreak, endBreak, endWork)
    refetch()
    setScreen("find")
  }

  const { loading, error, data } = useQuery(query)

  useEffect(() => {
    if (timecardSetting?.attributes.order > 0) {
      setStartWork("")
      setStartBreak("")
      setEndBreak("")
      setEndWork("")
    } else {
      setStartWork(formatDateTimeMinute(editTimecard.attributes.startWork))
      setStartBreak(formatDateTimeMinute(editTimecard.attributes.startBreak))
      setEndBreak(formatDateTimeMinute(editTimecard.attributes.endBreak))
      setEndWork(formatDateTimeMinute(editTimecard.attributes.endWork))
    }
  }, [timecardSetting])

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
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
          Edit
        </h1>
        <form
          className="flex flex-col"
          onSubmit={async (e) => {
            e.preventDefault()
            await handleEdit()
          }}
        >
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
              <input type="date" name="date" id="date" value={date}
                     className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                     onChange={(e) => setDate(e.target.value)}
              />
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
              <select name="type" id="type" value={timecardSetting.attributes.name}
                      className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                      onChange={(e) => {
                        const selectedType = data.timecardSettings.data.find(setting => setting.attributes.name === e.target.value)
                        setTimecardSetting(selectedType)
                      }}
              >
                {[...data.timecardSettings.data]
                .sort((a, b) => (a.attributes.order || 0) - (b.attributes.order || 0))
                .map((timecardSetting) => (
                  <option key={timecardSetting.id} value={timecardSetting.attributes.name}>
                    {timecardSetting.attributes.name}
                  </option>
                ))}
              </select>
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
          <input type="datetime-local" name="startWork" id="startWork" value={startWork}
                 className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                 onChange={(e) => setStartWork(e.target.value)}
          />

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
          <input type="datetime-local" name="startBreak" id="startBreak" value={startBreak}
                 className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                 onChange={(e) => setStartBreak(e.target.value)}
          />

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
          <input type="datetime-local" name="endBreak" id="endBreak" value={endBreak}
                 className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                 onChange={(e) => setEndBreak(e.target.value)}
          />

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
          <input type="datetime-local" name="endWork" id="endWork" value={endWork}
                 className="border-0 px-2 py-2 mb-8 placeholder-blueGray-300 text-blueGray-600 bg-white rounded text-sm shadow focus:outline-none focus:ring w-full ease-linear transition-all duration-150"
                 onChange={(e) => setEndWork(e.target.value)}
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

export default Edit