import React, { useContext, useState, useEffect } from "react"
import { createTimecard } from "@/lib/api/timecard"
import { TimecardSetting } from "@/types/timecardSetting"
import { useQuery } from "@apollo/client"
import { gql } from "apollo-boost"
import { AppContext } from "@/context/AppContext"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { faPenToSquare, faSnowflake } from "@fortawesome/free-solid-svg-icons"
import { formatDate } from "@/lib/datetime"

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

const Create = ({ createDate }) => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext

  // TODO 時間が固定値
  const formattedDate = formatDate(createDate)
  const initStartWork = formattedDate + "T09:00:00"
  const initStartBreak = formattedDate + "T12:00:00"
  const initEndBreak = formattedDate + "T13:00:00"
  const initEndWork = formattedDate + "T18:00:00"

  const [date, setDate] = useState<string>(formattedDate)
  const [timecardSetting, setTimecardSetting] = useState<TimecardSetting | null>(null)
  const [startWork, setStartWork] = useState<string>(initStartWork)
  const [startBreak, setStartBreak] = useState<string>(initStartBreak)
  const [endBreak, setEndBreak] = useState<string>(initEndBreak)
  const [endWork, setEndWork] = useState<string>(initEndWork)

  const handleSend = async () => {
    try {
      await createTimecard(user, new Date(date), timecardSetting, new Date(startWork), new Date(startBreak), new Date(endBreak), new Date(endWork))
    } catch (error) {
      console.error(error.response.data.error.message)
      return <p>{error.response.data.error.message}</p>
    }
  }

  const { loading, error, data } = useQuery(query)

  useEffect(() => {
    if (data && data.timecardSettings && data.timecardSettings.data) {
      const defaultSetting = data.timecardSettings.data.find(
        (setting : any) => setting.attributes.name === "-"
      )
      if (defaultSetting) {
        setTimecardSetting(defaultSetting)
      }
    }
  }, [data])

  useEffect(() => {
    if (timecardSetting?.attributes.order > 0) {
      setStartWork("")
      setStartBreak("")
      setEndBreak("")
      setEndWork("")
    } else {
      setStartWork(initStartWork)
      setStartBreak(initStartBreak)
      setEndBreak(initEndBreak)
      setEndWork(initEndWork)
    }
  }, [timecardSetting])

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
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
              <input type="date" name="date" id="date" value={date}
                     className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                     onChange={(e) => setDate(e.target.value)}
              />
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
              <select name="type" id="type" value={timecardSetting?.attributes.name}
                      className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                      onChange={(e) => {
                        const selectedType = [...data.timecardSettings.data]
                        .sort((a, b) => (a.attributes.order || 0) - (b.attributes.order || 0))
                        .find(setting => setting.attributes.name === e.target.value)
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
          <input type="datetime-local" name="startWork" id="startWork" value={startWork}
                 className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                 onChange={(e) => setStartWork(e.target.value)}
          />

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
          <input type="datetime-local" name="startBreak" id="startBreak" value={startBreak}
                 className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                 onChange={(e) => setStartBreak(e.target.value)}
          />

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
          <input type="datetime-local" name="endBreak" id="endBreak" value={endBreak}
                 className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                 onChange={(e) => setEndBreak(e.target.value)}
          />

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
          <input type="datetime-local" name="endWork" id="endWork" value={endWork}
                 className="mb-8 w-full rounded border-0 bg-white px-2 py-2 text-sm shadow transition-all duration-150 ease-linear placeholder-blueGray-300 text-blueGray-600 focus:outline-none focus:ring"
                 onChange={(e) => setEndWork(e.target.value)}
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