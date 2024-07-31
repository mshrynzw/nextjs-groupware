import React from "react"
import { deletedInfo } from "@/lib/api/info"

const Delete = ({ deleteInfo, setScreen, refetch }) => {
  const handleDelete = async () => {
    await deletedInfo(deleteInfo.id)
    refetch()
    setScreen("find")
  }

  const localTime = new Date(deleteInfo.attributes.updatedAt).toLocaleString()

  return (
    <div>
      <h2>Delete</h2>
      <h3>{deleteInfo.attributes.title}</h3>
      <p>{localTime}</p>
      <p>{deleteInfo.attributes.user.data.attributes.username}</p>
      <p>{deleteInfo.attributes.body}</p>
      <button onClick={handleDelete}>Delete</button>
    </div>
  )
}

export default Delete
