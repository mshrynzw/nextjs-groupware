import React, { useEffect } from "react"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"

const query = gql`
  {
    timecardSettings(sort: "order:asc"){
      data{
        id
        attributes{
          name
          description
          order
          color
          createdAt
          updatedAt
        }
      }
    }
  }
`

const Find = ({ setScreen, setEditTimecardSetting, setDeleteTimecardSetting, refetchFlag }) => {
  const { loading, error, data, refetch } = useQuery(query)

  useEffect(() => {
    refetch()
  }, [refetchFlag])

  const handleEdit = (timecardSetting) => {
    setEditTimecardSetting(timecardSetting)
    setScreen("edit")
  }

  const handleDelete = (timecardSetting) => {
    setDeleteTimecardSetting(timecardSetting)
    setScreen("delete")
  }

  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  return (
    <>
      <h2>Find</h2>
      {data.timecardSettings.data.map((timecardSetting) => {
        try {
          const createdAtLocalTime = new Date(timecardSetting.attributes.createdAt).toLocaleString()
          const updatedAtLocalTime = new Date(timecardSetting.attributes.updatedAt).toLocaleString()
          return (
            <div key={timecardSetting.id}>
              <h3>{timecardSetting.attributes.name}</h3>
              <p>{createdAtLocalTime}</p>
              <p>{updatedAtLocalTime}</p>
              <p>{timecardSetting.attributes.description}</p>
              <p>{String(timecardSetting.attributes.order)}</p>
              <p>{timecardSetting.attributes.color}</p>
              <button onClick={() => handleEdit(timecardSetting)}>Edit</button>
              <button onClick={() => handleDelete(timecardSetting)}>Delete</button>
            </div>
          )
        } catch (e) {
          console.error("Error processing message:", timecardSetting, e)
          return <p key={timecardSetting.id}>Error displaying message</p>
        }
      })}
    </>
  )
}

export default Find
