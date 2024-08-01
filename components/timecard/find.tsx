import React, { useContext, useEffect } from "react"
import { AppContext } from "@/context/AppContext"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"
import { getDatesInCurrentMonth } from "@/lib/datetime"

const query = gql`
  query ($userId: ID!) {
    timecards(filters: { user: { id: { eq: $userId } } }, sort: "date:asc") {
      data {
        id
        attributes {
          date
          type {
            data {
              attributes {
                name
              }
            }
          }
          startWork
          startBreak
          endBreak
          endWork
        }
      }
    }
  }
`

interface FindProps {
  setScreen: (screen: string) => void;
  setEditTimecard: (timecard: any) => void;
  setDeleteTimecard: (timecard: any) => void;
  refetchFlag: boolean;
}

const Find: React.FC<FindProps> = ({ setScreen, setEditTimecard, setDeleteTimecard, setCreateDate, refetchFlag }) => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext
  const { loading, error, data, refetch } = useQuery(query, {
    variables : { userId : user?.id }
  })

  useEffect(() => {
    refetch()
  }, [refetchFlag])

  const handleEdit = (timecard) => {
    setEditTimecard(timecard)
    setScreen("edit")
  }

  const handleDelete = (timecard) => {
    setDeleteTimecard(timecard)
    setScreen("delete")
  }

  const handleCreate=(date)=>{
    setCreateDate(date)
    setScreen("create")
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  const dates : Date[] = getDatesInCurrentMonth()

  return (
    <>
      <table>
        <thead>
        <tr>
          <th>Date</th>
          <th>Type</th>
          <th>Start Work</th>
          <th>Start Break</th>
          <th>End Break</th>
          <th>End Work</th>
        </tr>
        </thead>
        <tbody>
        {dates.map((date) => {
          const localDate = new Date(date).toLocaleDateString()
          const matchingTimecards = data.timecards.data.filter((timecard) =>
            new Date(timecard.attributes.date).toLocaleDateString() === localDate
          )

          return matchingTimecards.length > 0 ? (
            matchingTimecards.map((timecard) => (
              <tr key={timecard.id}>
                <td>{localDate}</td>
                <td>{timecard.attributes.type.data?.attributes.name}</td>
                <td>{timecard.attributes.startWork ? new Date(timecard.attributes.startWork).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</td>
                <td>{timecard.attributes.startBreak ? new Date(timecard.attributes.startBreak).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</td>
                <td>{timecard.attributes.endBreak ? new Date(timecard.attributes.endBreak).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</td>
                <td>{timecard.attributes.endWork ? new Date(timecard.attributes.endWork).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : ""}</td>
                <td>
                  <button onClick={() => handleEdit(timecard)}>Edit</button>
                </td>
                <td>
                  <button onClick={() => handleDelete(timecard)}>Delete</button>
                </td>
              </tr>
            ))
          ) : (
            <tr key={localDate}>
              <td>{localDate}</td>
              <td colSpan={5}></td>
              <td colSpan={2}><button onClick={() => handleCreate(localDate)}>Create</button></td>
            </tr>
          )
        })}
        </tbody>
      </table>
    </>
  )
}

export default Find
