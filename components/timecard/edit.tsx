import React, { useState, useEffect } from "react"
import { TimecardSetting } from "@/types/timecardSetting"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"
import { editedTimecard } from "@/lib/api/timecard"

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

const Edit = ({ editTimecard, setScreen, refetch }) => {
  const [date, setDate] = useState<string>(editTimecard.attributes.date)
  const [type, setType] = useState<TimecardSetting>(editTimecard.attributes.type.data)
  const [startWork, setStartWork] = useState<string>(editTimecard.attributes.startWork)
  const [startBreak, setStartBreak] = useState<string>(editTimecard.attributes.startBreak)
  const [endBreak, setEndBreak] = useState<string>(editTimecard.attributes.endBreak)
  const [endWork, setEndWork] = useState<string>(editTimecard.attributes.endWork)

  useEffect(() => {
    setStartWork(new Date(editTimecard.attributes.startWork).toISOString().slice(0, 16))
    setStartBreak(new Date(editTimecard.attributes.startBreak).toISOString().slice(0, 16))
    setEndBreak(new Date(editTimecard.attributes.endBreak).toISOString().slice(0, 16))
    setEndWork(new Date(editTimecard.attributes.endWork).toISOString().slice(0, 16))
  }, [editTimecard])

  const handleEdit = async () => {
    await editedTimecard(editTimecard.id, type, startWork, startBreak, endBreak, endWork)
    refetch()
    setScreen("find")
  }

  const { loading, error, data } = useQuery(query)

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  return (
    <div>
      <h2>Edit</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleEdit()
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
          value={type.attributes.name}
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
    </div>
  )
}

export default Edit