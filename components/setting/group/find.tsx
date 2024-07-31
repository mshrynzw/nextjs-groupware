import React, { useEffect } from "react"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"

const query = gql`
  {
    groups { 
      data {
        id
        attributes {
          name
          users {
            data {
              id
              attributes {
                username
              }
            }
          }
          updatedAt
        }
      }
    }  
  }
`

const Find = ({ setScreen, setEditGroup, setDeleteGroup, refetchFlag }) => {
  const { loading, error, data, refetch } = useQuery(query)

  useEffect(() => {
    refetch()
  }, [refetchFlag])

  const handleEdit = (group) => {
    setEditGroup(group)
    setScreen("edit")
  }

  const handleDelete = (group) => {
    setDeleteGroup(group)
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
      {data.groups.data.map((group) => {
        try {
          const localTime = new Date(group.attributes.updatedAt).toLocaleString()
          return (
            <div key={group.id}>
              <h3>{group.attributes.name}</h3>
              <p>Updated at {localTime}</p>
              <ul>
                {group.attributes.users.data.map((user) => {
                  return (
                    <li key={user.id}>{user.attributes.username}</li>
                  )
                })}
              </ul>
              <button onClick={() => handleEdit(group)}>Edit</button>
              <button onClick={() => handleDelete(group)}>Delete</button>
            </div>
          )
        } catch (e) {
          console.error("Error processing message:", group, e)
          return <p key={group.id}>Error displaying message</p>
        }
      })}
    </>
  )
}

export default Find
