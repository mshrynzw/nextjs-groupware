import React, { useState } from "react"
import { createdGroup } from "@/lib/api/setting/group"
import { User } from "@/types/user"
import { useQuery } from "@apollo/client"
import { gql } from "apollo-boost"

const query = gql`
  {
    usersPermissionsUsers {
      data{
        id
        attributes{
          username
        }
      }
    }
  }
`

const Create = () => {
  const [name, setName] = useState<string>("")
  const [users, setUsers] = useState<User[]>([])

  const { loading, error, data } = useQuery(query)
  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  const handleSend = async () => {
    try {
      await createdGroup(name, users)
      setName("")
      setUsers([])
    } catch (error) {
      console.log(error.response.data.error.message)
    }
  }

  return (
    <>
      <h2>Create</h2>
      <form
        onSubmit={async (e) => {
          await handleSend()
        }}
      >
        <label htmlFor="name">Title</label>
        <input type="text" name="name" id="name" onChange={(e) => setName(e.target.value)}/>
        <label htmlFor="users">Users</label>
        <select name="users" id="users" multiple onChange={(e) => {
          const selectedOptions = Array.from(e.target.selectedOptions)
          const selectedUsers = selectedOptions.map(option => {
            return data.usersPermissionsUsers.data.find(user => user.attributes.username === option.value)
          })
          setUsers(selectedUsers)
        }}>
          {data.usersPermissionsUsers.data.map((user) => {
            return (
              <option key={user.id} value={user.attributes.username}>{user.attributes.username}</option>
            )
          })}
        </select>
        <button type="submit">Submit</button>
      </form>
    </>
  )
}

export default Create
