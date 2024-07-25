import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"
import React, { useEffect } from "react"

const query = gql`
  {
    infos(pagination: { limit: 10 }, sort: "updatedAt:asc"){
      data{
        id
        attributes{
          user{
            data{
              attributes{
                username
              }
            }
          }
          title
          body
          updatedAt
        }
      }
    }
  }
`

const Find = ({ setScreen, setEditInfo, setDeleteInfo, refetchFlag }) => {
  const { loading, error, data, refetch } = useQuery(query)

  useEffect(() => {
    refetch()
  }, [refetchFlag])

  const handleEdit = (info) => {
    setEditInfo(info)
    setScreen("edit")
  }

  const handleDelete = (info) => {
    setDeleteInfo(info)
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
      {data.infos.data.map((info) => {
        try {
          const localTime = new Date(info.attributes.updatedAt).toLocaleString()
          return (
            <div key={info.id}>
              <h3>{info.attributes.title}</h3>
              <p>{localTime}</p>
              <p>{info.attributes.user.data.attributes.username}</p>
              <p>{info.attributes.body}</p>
              <button onClick={() => handleEdit(info)}>Edit</button>
              <button onClick={() => handleDelete(info)}>Delete</button>
            </div>
          )
        } catch (e) {
          console.error("Error processing message:", info, e)
          return <p key={info.id}>Error displaying message</p>
        }
      })}
    </>
  )
}

export default Find
