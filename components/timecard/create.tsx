import React, { useContext, useState } from "react"
import { createTimecard } from "@/lib/api/timecard"
import { TimecardSetting } from "@/types/timecardSetting"
import { useQuery } from "@apollo/client"
import { gql } from "apollo-boost"
import { AppContext } from "@/context/AppContext"

const query = gql`
  {
    timecardSettings {
      data {
        id
        attributes {
          name
        }
      }
    }
  }
`

const Create = (createDate) => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext

  const [date, setDate] = useState<string>("")
  const [type, setType] = useState<TimecardSetting>(null)
  const [startWork, setStartWork] = useState<string>("")
  const [startBreak, setStartBreak] = useState<string>("")
  const [endBreak, setEndBreak] = useState<string>("")
  const [endWork, setEndWork] = useState<string>("")

  const handleSend = async () => {
    try {
      await createTimecard(user, new Date(date), type, new Date(startWork), new Date(startBreak), new Date(endBreak), new Date(endWork))
    } catch (error) {
      console.log(error.response.data.error.message)
      return <p>{error.response.data.error.message}</p>
    }
  }

  const { loading, error, data } = useQuery(query)

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  return (
    <>
      <h2>Create</h2>
      <form
        onSubmit={async (e) => {
          await handleSend()
        }}
      >
        <label htmlFor="date">Date</label>
        <input
          type="date"
          name="date"
          id="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
        />
        <label htmlFor="type">Type</label>
        <select
          name="type"
          id="type"
          value="-"
          onChange={(e) => {
            const selectedType = data.timecardSettings.data.find(setting => setting.attributes.name === e.target.value)
            setType(selectedType)
          }}
        >
          {data.timecardSettings.data.map((timecardSetting) => (
            <option key={timecardSetting.id} value={timecardSetting.attributes.name}>
              {timecardSetting.attributes.name}
            </option>
          ))}
        </select>
        <label htmlFor="startWork">Start Work</label>
        <input
          type="datetime-local"
          name="startWork"
          id="startWork"
          value={startWork}
          onChange={(e) => setStartWork(e.target.value)}
        />
        <label htmlFor="startBreak">Start Break</label>
        <input
          type="datetime-local"
          name="startBreak"
          id="startBreak"
          value={startBreak}
          onChange={(e) => setStartBreak(e.target.value)}
        />
        <label htmlFor="endBreak">End Break</label>
        <input
          type="datetime-local"
          name="endBreak"
          id="endBreak"
          value={endBreak}
          onChange={(e) => setEndBreak(e.target.value)}
        />
        <label htmlFor="endWork">End Work</label>
        <input
          type="datetime-local"
          name="endWork"
          id="endWork"
          value={endWork}
          onChange={(e) => setEndWork(e.target.value)}
        />
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default Create
