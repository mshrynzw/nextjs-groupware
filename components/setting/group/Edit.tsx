import React, { useState } from "react"
import { editedGroup } from "@/lib/api/setting/group"
import { User } from "@/types/user"
import { gql } from "apollo-boost"
import { useQuery } from "@apollo/client"
import { getLocalTime } from "@/lib/datetime"

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

const Edit = ({ editGroup, setScreen, refetch }) => {
  const [name, setName] = useState<string>(editGroup.attributes.name)
  const [users, setUsers] = useState<User[]>(editGroup.attributes.users.data)

  const { loading, error, data } = useQuery(query)
  if (loading) return <p>Loading...</p>
  if (error) {
    console.error("Error fetching messages:", error)
    return <p>Error: {error.message}</p>
  }

  const handleEdit = async () => {
    await editedGroup(editGroup.id, name, users)
    refetch()
    setScreen("find")
  }

  const localTime = getLocalTime(editGroup.attributes.updatedAt)

  return (
    <div>
      <h2>Edit</h2>
      <form
        onSubmit={async (e) => {
          e.preventDefault()
          await handleEdit()
        }}
      >
        <label htmlFor="name">Name</label>
        <input
          type="text"
          name="name"
          id="name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <p>{localTime}</p>
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
    </div>
  )
}

export default Edit
