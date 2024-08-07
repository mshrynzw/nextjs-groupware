import React, { useContext, useEffect } from "react"
import { AppContext } from "@/context/AppContext"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"
import { formatMonthDateDay, formatTime, getDatesInCurrentMonth, getDayColor } from "@/lib/datetime"
import styles from "./Find.module.css"
import { faPenToSquare, faEllipsis, faTrash } from "@fortawesome/free-solid-svg-icons"
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome"
import { startOfMonth, endOfMonth, format } from 'date-fns';

const query = gql`
  query GetTimecards($userId: ID!, $startDate: Date!, $endDate: Date!) {
    timecards(
      filters: { 
        user: { id: { eq: $userId } },
        date: { 
          gte: $startDate,
          lte: $endDate
        }
      }, 
      sort: "date:asc",
      pagination: { limit: 31 }
    ) {
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
      meta {
        pagination {
          total
        }
      }
    }
  }
`

interface FindProps {
  setScreen : (screen : string) => void;
  setEditTimecard : (timecard : any) => void;
  setDeleteTimecard : (timecard : any) => void;
  refetchFlag : boolean;
}

const Find : React.FC<FindProps> = ({ setScreen, setEditTimecard, setDeleteTimecard, setCreateDate, refetchFlag }) => {
  const appContext = useContext(AppContext)
  if (!appContext) {
    throw new Error("Sidebar must be used within an AppProvider")
  }
  const { user } = appContext
  const startDate = format(startOfMonth(new Date()), 'yyyy-MM-dd');
  const endDate = format(endOfMonth(new Date()), 'yyyy-MM-dd');
  const { loading, error, data, refetch } = useQuery(query, {
    variables : { userId : user?.id, startDate, endDate }
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

  const handleCreate = (date) => {
    setCreateDate(date)
    setScreen("create")
  }

  if (loading) return <p>Loading...</p>
  if (error) return <p>Error: {error.message}</p>

  const dates : Date[] = getDatesInCurrentMonth()
console.log(data)
  return (
    <div className="relative block w-full min-w-0 overflow-x-auto break-words rounded-lg bg-white p-4 shadow-lg">
      <div className={styles.tableContainer}>
        <table className="w-full border-collapse items-center bg-transparent">
          <thead className={styles.stickyHeader}>
          <tr>
            <th className={`sticky left-0 z-10 whitespace-nowrap px-6 py-3 text-center align-middle text-xs font-semibold uppercase bg-blueGray-600 text-blueGray-200 border-blueGray-500`}>Date</th>
            <th className="whitespace-nowrap px-6 py-3 text-center align-middle text-xs font-semibold uppercase bg-blueGray-600 text-blueGray-200 border-blueGray-500"/>
            <th className="whitespace-nowrap px-6 py-3 text-center align-middle text-xs font-semibold uppercase bg-blueGray-600 text-blueGray-200 border-blueGray-500">Type</th>
            <th className="whitespace-nowrap px-6 py-3 text-center align-middle text-xs font-semibold uppercase bg-blueGray-600 text-blueGray-200 border-blueGray-500">Start Work</th>
            <th className="whitespace-nowrap px-6 py-3 text-center align-middle text-xs font-semibold uppercase bg-blueGray-600 text-blueGray-200 border-blueGray-500">Start Break</th>
            <th className="whitespace-nowrap px-6 py-3 text-center align-middle text-xs font-semibold uppercase bg-blueGray-600 text-blueGray-200 border-blueGray-500">End Break</th>
            <th className="whitespace-nowrap px-6 py-3 text-center align-middle text-xs font-semibold uppercase bg-blueGray-600 text-blueGray-200 border-blueGray-500">End Work</th>
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
                <tr key={timecard.id} className={styles.tableRow}>
                  <th className={`${styles.stickyColumn} items-center whitespace-nowrap p-2 px-6 text-left align-middle text-sm ${getDayColor(date)}`}>
                    {formatMonthDateDay(date)}
                  </th>
                  <td className="whitespace-nowrap p-2 px-6 text-center align-middle text-sm space-x-4">
                    <button onClick={() => handleEdit(timecard)}>
                      <FontAwesomeIcon icon={faEllipsis}/>
                    </button>
                    <button onClick={() => handleDelete(timecard)}>
                      <FontAwesomeIcon icon={faTrash}/>
                    </button>
                  </td>
                  <td className="whitespace-nowrap p-2 px-6 align-middle text-sm">{timecard.attributes.type.data?.attributes.name}</td>
                  <td className="whitespace-nowrap p-2 px-6 align-middle text-sm">{timecard.attributes.startWork ? formatTime(timecard.attributes.startWork) : ""}</td>
                  <td className="whitespace-nowrap p-2 px-6 align-middle text-sm">{timecard.attributes.startBreak ? formatTime(timecard.attributes.startBreak) : ""}</td>
                  <td className="whitespace-nowrap p-2 px-6 align-middle text-sm">{timecard.attributes.endBreak ? formatTime(timecard.attributes.endBreak) : ""}</td>
                  <td className="whitespace-nowrap p-2 px-6 align-middle text-sm">{timecard.attributes.endWork ? formatTime(timecard.attributes.endWork) : ""}</td>
                </tr>
              ))
            ) : (
              <tr key={localDate} className={styles.tableRow}>
                <th className={`${styles.stickyColumn} items-center whitespace-nowrap p-2 px-6 text-left align-middle text-sm ${getDayColor(date)}`}>
                  {formatMonthDateDay(date)}
                </th>
                <td className="whitespace-nowrap p-2 px-6 text-center align-middle text-sm">
                  <button onClick={() => handleCreate(localDate)}>
                    <FontAwesomeIcon icon={faPenToSquare}/>
                  </button>
                </td>
                <td colSpan={5} className="whitespace-nowrap p-2 px-6 align-middle text-sm"></td>
              </tr>
            )
          })}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default Find