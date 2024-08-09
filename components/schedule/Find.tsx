import React, { useEffect, useRef } from "react"
import Calendar from "@event-calendar/core"
import TimeGrid from "@event-calendar/time-grid"
import Interaction from "@event-calendar/interaction"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"
import "@event-calendar/core/index.css"
import { getLocalTime } from "@/lib/datetime"

const query = gql`
  {
    schedules{
      data{
      id
        attributes{
          start
          end
          title
          textColor
          backgroundColor 
        }
      }
    }
  }
`

const Find = ({ setScreen, setCreateSchedule, setEditSchedule, setDeleteSchedule, refetchFlag }) => {
  useEffect(() => {
    refetch()
  }, [refetchFlag])

  const calendarRef = useRef(null)
  const { loading, error, data, refetch } = useQuery(query)

  useEffect(() => {
    if (loading || error || !data) return

    const events = data.schedules.data.map((item) => ({
      id : item.id,
      start : getLocalTime(item.attributes.start),
      end : getLocalTime(item.attributes.end),
      title : item.attributes.title,
      textColor : item.attributes.textColor,
      color : item.attributes.backgroundColor
    }))

    if (calendarRef.current) {
      const ec = new Calendar({
        target : calendarRef.current,
        props : {
          plugins : [TimeGrid, Interaction],
          options : {
            view : "timeGridWeek",
            eventClick : (event) => {
              setScreen("editDelete")
              setEditSchedule(event)
              setDeleteSchedule(event)
            },
            select : (event) => {
              setScreen("create")
              setCreateSchedule({
                startStr : event.startStr,
                endStr : event.endStr
              })
            },
            selectable : {},
            events : events
          }
        }
      })

      return () => {
        ec.destroy()
      }
    }
  }, [loading, error, data])

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  return (
    <div className="text-sm">
      <div ref={calendarRef}/>
    </div>
  )
}

export default Find